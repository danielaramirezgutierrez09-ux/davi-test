import { ConflictException, NotFoundException } from '@nestjs/common';
import { AccountsService } from './accounts.service';

describe('AccountsService', () => {
  const prisma: any = {
    account: { count: jest.fn(), findMany: jest.fn(), findUnique: jest.fn() },
    user: { findUnique: jest.fn(), create: jest.fn() },
    $transaction: jest.fn((promises: Promise<unknown>[]) => Promise.all(promises)),
  };
  const service = new AccountsService(prisma);

  beforeEach(() => jest.clearAllMocks());

  it('createWithUser crea usuario CLIENT con cuenta y avatar genérico', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.account.count.mockResolvedValue(5);
    prisma.user.create.mockImplementation(({ data }: any) => data);

    const res: any = await service.createWithUser({
      fullName: 'Carla Ruiz',
      email: 'carla@findash.com',
      password: 'Password123!',
      type: 'PREMIUM' as any,
      initialBalance: 500,
    });

    expect(res.role).toBe('CLIENT');
    expect(res.avatarUrl).toBe('/avatar.svg');
    expect(res.accounts.create.accountNumber).toBe('FD-1006');
    expect(res.accounts.create.type).toBe('PREMIUM');
    expect(res.password).not.toBe('Password123!');
  });

  it('createWithUser usa saldo 0 por defecto', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.account.count.mockResolvedValue(0);
    prisma.user.create.mockImplementation(({ data }: any) => data);
    const res: any = await service.createWithUser({
      fullName: 'Pedro Corp',
      email: 'pedro@findash.com',
      password: 'Password123!',
      type: 'CORPORATE' as any,
    });
    expect(res.accounts.create.balance).toBe(0);
  });

  it('createWithUser 409 si email duplicado', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u1' });
    await expect(
      service.createWithUser({
        fullName: 'X',
        email: 'dup@findash.com',
        password: 'Password123!',
        type: 'BASIC' as any,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('findAll pagina y aplica filtros', async () => {
    prisma.account.count.mockResolvedValue(25);
    prisma.account.findMany.mockResolvedValue([{ id: 'a1' }]);

    const res = await service.findAll({ page: 2, limit: 10, type: 'BASIC' as any, search: 'ana' });

    expect(res.meta).toEqual({ total: 25, page: 2, limit: 10, totalPages: 3 });
    expect(prisma.account.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 10, take: 10 }),
    );
  });

  it('findAll sin filtros usa where vacío', async () => {
    prisma.account.count.mockResolvedValue(0);
    prisma.account.findMany.mockResolvedValue([]);
    const res = await service.findAll({ page: 1, limit: 10 } as any);
    expect(res.meta.total).toBe(0);
  });

  it('findMine devuelve cuentas del usuario', async () => {
    prisma.account.findMany.mockResolvedValue([{ id: 'mine' }]);
    expect(await service.findMine('u1')).toEqual([{ id: 'mine' }]);
  });

  it('findOne 404 cuando no existe', async () => {
    prisma.account.findUnique.mockResolvedValue(null);
    await expect(service.findOne('nope')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('findOne devuelve la cuenta con titular', async () => {
    prisma.account.findUnique.mockResolvedValue({ id: 'a1', user: {} });
    expect(await service.findOne('a1')).toEqual({ id: 'a1', user: {} });
  });
});
