import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma';
import { TransfersService } from './transfers.service';
import { AntiFraudService } from './antifraud.service';
import { EventsService } from '../common/events.service';

const dto = {
  fromAccountId: 'from-1',
  toAccountId: 'to-1',
  amount: 100,
};
const client = { id: 'user-1', email: 'c@c.com', role: 'CLIENT' as const };
const admin = { id: 'admin-1', email: 'a@a.com', role: 'ADMIN' as const };

function makePrisma() {
  const txMock = {
    account: { findMany: jest.fn(), updateMany: jest.fn() },
    transaction: { create: jest.fn() },
  };
  const prisma: any = {
    transaction: {
      findUnique: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
    },
    account: { findUnique: jest.fn(), findMany: jest.fn() },
    $transaction: jest.fn((cb: any) => cb(txMock)),
    _tx: txMock,
  };
  return prisma;
}

function makeService(prisma: any, antiFraud?: Partial<AntiFraudService>) {
  const events = new EventsService();
  jest.spyOn(events, 'emitTransaction').mockImplementation(() => undefined);
  const fraud: any = antiFraud ?? { check: jest.fn().mockResolvedValue({ approved: true, score: 0.1 }) };
  const service = new TransfersService(prisma, fraud, events);
  return { service, events };
}

describe('TransfersService', () => {
  describe('RN-01 idempotencia', () => {
    it('repetición con la misma key devuelve la tx original sin reprocesar', async () => {
      const prisma = makePrisma();
      const original = { id: 'tx-1', idempotencyKey: 'key-1', status: 'COMPLETED' };
      prisma.transaction.findUnique.mockResolvedValue(original);
      const { service } = makeService(prisma);

      const result = await service.execute(dto, 'key-1', client);

      expect(result).toEqual({ transaction: original, duplicated: true });
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('validaciones', () => {
    it('rechaza misma cuenta origen/destino', async () => {
      const prisma = makePrisma();
      prisma.transaction.findUnique.mockResolvedValue(null);
      const { service } = makeService(prisma);
      await expect(
        service.execute({ ...dto, toAccountId: dto.fromAccountId }, 'k2', client),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('404 si la cuenta origen no existe', async () => {
      const prisma = makePrisma();
      prisma.transaction.findUnique.mockResolvedValue(null);
      prisma.account.findUnique.mockResolvedValue(null);
      const { service } = makeService(prisma);
      await expect(service.execute(dto, 'k3', client)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('cliente no puede transferir desde cuenta ajena (RBAC)', async () => {
      const prisma = makePrisma();
      prisma.transaction.findUnique.mockResolvedValue(null);
      prisma.account.findUnique.mockResolvedValue({ id: 'from-1', userId: 'otro', type: 'BASIC', balance: new Prisma.Decimal(1000) });
      const { service } = makeService(prisma);
      await expect(service.execute(dto, 'k4', client)).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('admin sí puede transferir desde cuenta ajena', async () => {
      const prisma = makePrisma();
      prisma.transaction.findUnique.mockResolvedValue(null);
      prisma.account.findUnique.mockResolvedValue({ id: 'from-1', userId: 'otro', type: 'PREMIUM', balance: new Prisma.Decimal(1000) });
      prisma._tx.account.findMany.mockResolvedValue([
        { id: 'from-1', version: 0, balance: new Prisma.Decimal(1000) },
        { id: 'to-1', version: 0, balance: new Prisma.Decimal(0) },
      ]);
      prisma._tx.account.updateMany.mockReturnValue({ count: 1 });
      prisma._tx.transaction.create.mockResolvedValue({ id: 'tx-9', status: 'COMPLETED' });
      const { service } = makeService(prisma);
      const result = await service.execute(dto, 'k5', admin);
      expect(result.duplicated).toBe(false);
    });
  });

  describe('RN-02 anti-fraude', () => {
    it('timeout -> registra FAILED y propaga 503 limpio', async () => {
      const prisma = makePrisma();
      prisma.transaction.findUnique.mockResolvedValue(null);
      prisma.account.findUnique.mockResolvedValue({ id: 'from-1', userId: 'user-1', type: 'BASIC', balance: new Prisma.Decimal(1000) });
      prisma.transaction.create.mockResolvedValue({ id: 'tx-f', status: 'FAILED' });
      const { service } = makeService(prisma, {
        check: jest.fn().mockRejectedValue(new ServiceUnavailableException('timeout')),
      });
      await expect(service.execute(dto, 'k6', client)).rejects.toBeInstanceOf(ServiceUnavailableException);
      expect(prisma.transaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'FAILED', failureReason: 'Anti-fraud timeout', idempotencyKey: 'k6' }),
        }),
      );
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('rechazo del motor -> FAILED sin mover saldos', async () => {
      const prisma = makePrisma();
      prisma.transaction.findUnique.mockResolvedValue(null);
      prisma.account.findUnique.mockResolvedValue({ id: 'from-1', userId: 'user-1', type: 'BASIC', balance: new Prisma.Decimal(1000) });
      prisma.transaction.create.mockResolvedValue({ id: 'tx-r', status: 'FAILED' });
      const { service } = makeService(prisma, {
        check: jest.fn().mockResolvedValue({ approved: false, score: 0.99 }),
      });
      const result = await service.execute(dto, 'k7', client);
      expect(result.transaction.status).toBe('FAILED');
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('RN-03 comisiones + RN-04 orquestación atómica', () => {
    function setupTx(prisma: any, fromBalance: number, type = 'BASIC') {
      prisma.transaction.findUnique.mockResolvedValue(null);
      prisma.account.findUnique.mockResolvedValue({ id: 'from-1', userId: 'user-1', type, balance: new Prisma.Decimal(fromBalance) });
      prisma._tx.account.findMany.mockResolvedValue([
        { id: 'from-1', version: 3, balance: new Prisma.Decimal(fromBalance) },
        { id: 'to-1', version: 1, balance: new Prisma.Decimal(0) },
      ]);
      prisma._tx.account.updateMany.mockReturnValue({ count: 1 });
      prisma._tx.transaction.create.mockImplementation(({ data }: any) => Promise.resolve({ id: 'tx-ok', ...data }));
    }

    it('BASIC: débito = monto + 2% y tx COMPLETED con código de autorización', async () => {
      const prisma = makePrisma();
      setupTx(prisma, 500);
      const { service, events } = makeService(prisma);

      const result = await service.execute(dto, 'k8', client);

      expect(prisma._tx.account.updateMany).toHaveBeenNthCalledWith(1, {
        where: { id: 'from-1', version: 3, balance: { gte: 102 } },
        data: { balance: { decrement: 102 }, version: { increment: 1 } },
      });
      expect(prisma._tx.account.updateMany).toHaveBeenNthCalledWith(2, {
        where: { id: 'to-1', version: 1 },
        data: { balance: { increment: 100 }, version: { increment: 1 } },
      });
      expect(result.transaction.status).toBe('COMPLETED');
      expect(result.transaction.fee).toBe(2);
      expect(result.transaction.authorizationCode).toMatch(/^AUTH-/);
      expect(events.emitTransaction).toHaveBeenCalled();
    });

    it('fondos insuficientes -> BadRequest sin débito', async () => {
      const prisma = makePrisma();
      setupTx(prisma, 50);
      const { service } = makeService(prisma);
      await expect(service.execute(dto, 'k9', client)).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma._tx.account.updateMany).not.toHaveBeenCalled();
    });

    it('modificación concurrente (count=0) -> Conflict', async () => {
      const prisma = makePrisma();
      setupTx(prisma, 500);
      prisma._tx.account.updateMany.mockReturnValueOnce({ count: 0 });
      const { service } = makeService(prisma);
      await expect(service.execute(dto, 'k10', client)).rejects.toBeInstanceOf(ConflictException);
    });

    it('conflicto al acreditar destino -> Conflict', async () => {
      const prisma = makePrisma();
      setupTx(prisma, 500);
      prisma._tx.account.updateMany
        .mockReturnValueOnce({ count: 1 })
        .mockReturnValueOnce({ count: 0 });
      const { service } = makeService(prisma);
      await expect(service.execute(dto, 'k11', client)).rejects.toBeInstanceOf(ConflictException);
    });

    it('cuenta destino inexistente dentro de tx -> NotFound', async () => {
      const prisma = makePrisma();
      prisma.transaction.findUnique.mockResolvedValue(null);
      prisma.account.findUnique.mockResolvedValue({ id: 'from-1', userId: 'user-1', type: 'BASIC', balance: new Prisma.Decimal(500) });
      prisma._tx.account.findMany.mockResolvedValue([{ id: 'from-1', version: 0, balance: new Prisma.Decimal(500) }]);
      const { service } = makeService(prisma);
      await expect(service.execute(dto, 'k12', client)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  it('findByAccount lista últimas 50 transacciones', async () => {
    const prisma = makePrisma();
    prisma.transaction.findMany.mockResolvedValue([{ id: 't1' }]);
    const { service } = makeService(prisma);
    const result = await service.findByAccount('acc-1');
    expect(result).toEqual([{ id: 't1' }]);
    expect(prisma.transaction.findMany).toHaveBeenCalledWith({
      where: { OR: [{ fromAccountId: 'acc-1' }, { toAccountId: 'acc-1' }] },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  });
});

