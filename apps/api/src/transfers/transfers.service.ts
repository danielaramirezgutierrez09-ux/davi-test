import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Role, Transaction } from '../generated/prisma';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AntiFraudService } from './antifraud.service';
import { CommissionResolver } from './commissions/commission.strategy';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { EventsService } from '../common/events.service';
import { AuthUser } from '../auth/jwt.strategy';

export interface TransferResult {
  transaction: Transaction;
  duplicated: boolean;
}

/**
 * RN-04: transfer orchestration lives here, not in controllers.
 * Flow: idempotency (RN-01) -> anti-fraud screening (RN-02) ->
 * commission (RN-03) -> atomic balance update (RNF ACID).
 */
@Injectable()
export class TransfersService {
  private readonly commissions = new CommissionResolver();

  constructor(
    private readonly prisma: PrismaService,
    private readonly antiFraud: AntiFraudService,
    private readonly events: EventsService,
  ) {}

  async execute(
    dto: CreateTransferDto,
    idempotencyKey: string,
    user: AuthUser,
  ): Promise<TransferResult> {
    // RN-01: idempotency — replay returns the original transaction.
    const existing = await this.prisma.transaction.findUnique({
      where: { idempotencyKey },
    });
    if (existing) return { transaction: existing, duplicated: true };

    if (dto.fromAccountId === dto.toAccountId) {
      throw new BadRequestException('Source and destination must differ');
    }

    const fromAccount = await this.prisma.account.findUnique({
      where: { id: dto.fromAccountId },
    });
    if (!fromAccount) throw new NotFoundException('Source account not found');
    if (user.role !== Role.ADMIN && fromAccount.userId !== user.id) {
      throw new ForbiddenException('You can only transfer from your own accounts');
    }

    const amount = round2(dto.amount);
    // RN-03: commission by source account level.
    const fee = this.commissions.resolve(fromAccount.type).calculate(amount);

    // RN-02: anti-fraud screening with timeout -> clean abort.
    try {
      const screening = await this.antiFraud.check({
        fromAccountId: dto.fromAccountId,
        toAccountId: dto.toAccountId,
        amount,
      });
      if (!screening.approved) {
        return this.recordFailed(dto, idempotencyKey, amount, fee, 'Rejected by anti-fraud');
      }
    } catch (error) {
      await this.recordFailed(dto, idempotencyKey, amount, fee, 'Anti-fraud timeout');
      throw error;
    }

    const transaction = await this.applyAtomically(dto, idempotencyKey, amount, fee);
    this.events.emitTransaction({
      transactionId: transaction.id,
      status: transaction.status,
      amount,
    });
    return { transaction, duplicated: false };
  }

  /** Atomic balance update with optimistic locking to avoid race conditions. */
  private async applyAtomically(
    dto: CreateTransferDto,
    idempotencyKey: string,
    amount: number,
    fee: number,
  ): Promise<Transaction> {
    return this.prisma.$transaction(async (tx) => {
      const ids = [dto.fromAccountId, dto.toAccountId].sort();
      const accounts = await tx.account.findMany({ where: { id: { in: ids } } });
      const from = accounts.find((a) => a.id === dto.fromAccountId);
      const to = accounts.find((a) => a.id === dto.toAccountId);
      if (!from) throw new NotFoundException('Source account not found');
      if (!to) throw new NotFoundException('Destination account not found');

      const totalDebit = round2(amount + fee);
      if (from.balance.toNumber() < totalDebit) {
        throw new BadRequestException('Insufficient funds');
      }

      const debit = await tx.account.updateMany({
        where: { id: from.id, version: from.version, balance: { gte: totalDebit } },
        data: { balance: { decrement: totalDebit }, version: { increment: 1 } },
      });
      if (debit.count !== 1) {
        throw new ConflictException('Concurrent modification, retry the transfer');
      }
      const credit = await tx.account.updateMany({
        where: { id: to.id, version: to.version },
        data: { balance: { increment: amount }, version: { increment: 1 } },
      });
      if (credit.count !== 1) {
        throw new ConflictException('Concurrent modification, retry the transfer');
      }

      return tx.transaction.create({
        data: {
          idempotencyKey,
          fromAccountId: from.id,
          toAccountId: to.id,
          amount,
          fee,
          status: 'COMPLETED',
          authorizationCode: `AUTH-${randomUUID()}`,
        },
      });
    });
  }

  private async recordFailed(
    dto: CreateTransferDto,
    idempotencyKey: string,
    amount: number,
    fee: number,
    reason: string,
  ): Promise<TransferResult> {
    const transaction = await this.prisma.transaction.create({
      data: {
        idempotencyKey,
        fromAccountId: dto.fromAccountId,
        toAccountId: dto.toAccountId,
        amount,
        fee,
        status: 'FAILED',
        failureReason: reason,
        authorizationCode: `AUTH-${randomUUID()}`,
      },
    });
    return { transaction, duplicated: false };
  }

  findByAccount(accountId: string) {
    return this.prisma.transaction.findMany({
      where: {
        OR: [{ fromAccountId: accountId }, { toAccountId: accountId }],
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
