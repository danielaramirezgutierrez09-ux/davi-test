import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Prisma, Role } from '../generated/prisma';
import { PrismaService } from '../prisma/prisma.service';
import { QueryAccountsDto } from './dto/query-accounts.dto';
import { CreateAccountUserDto } from './dto/create-account-user.dto';

/** Avatar genérico servido por el frontend. */
export const DEFAULT_AVATAR_URL = '/avatar.svg';

@Injectable()
export class AccountsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Crea usuario CLIENT + cuenta (solo admin). */
  async createWithUser(dto: CreateAccountUserDto) {
    const exists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (exists) throw new ConflictException('Email ya registrado');

    const password = await bcrypt.hash(dto.password, 10);
    const accountNumber = await this.nextAccountNumber();

    return this.prisma.user.create({
      data: {
        email: dto.email,
        fullName: dto.fullName,
        password,
        role: Role.CLIENT,
        avatarUrl: DEFAULT_AVATAR_URL,
        accounts: {
          create: {
            accountNumber,
            type: dto.type,
            balance: dto.initialBalance ?? 0,
          },
        },
      },
      include: {
        accounts: true,
      },
    });
  }

  private async nextAccountNumber(): Promise<string> {
    const count = await this.prisma.account.count();
    return `FD-${1001 + count}`;
  }


  async findAll(query: QueryAccountsDto) {
    const { page, limit, type, search } = query;
    const where: Prisma.AccountWhereInput = {
      ...(type ? { type } : {}),
      ...(search
        ? {
            OR: [
              { accountNumber: { contains: search, mode: 'insensitive' } },
              { user: { fullName: { contains: search, mode: 'insensitive' } } },
              { user: { email: { contains: search, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };
    const [total, data] = await this.prisma.$transaction([
      this.prisma.account.count({ where }),
      this.prisma.account.findMany({
        where,
        include: {
          user: { select: { fullName: true, email: true, avatarUrl: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findMine(userId: string) {
    return this.prisma.account.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string) {
    const account = await this.prisma.account.findUnique({
      where: { id },
      include: {
        user: { select: { fullName: true, email: true, avatarUrl: true } },
      },
    });
    if (!account) throw new NotFoundException('Account not found');
    return account;
  }
}
