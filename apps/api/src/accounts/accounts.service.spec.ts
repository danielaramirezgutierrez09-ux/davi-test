import { NotFoundException } from '@nestjs/common';
import { AccountsService } from './accounts.service';

describe('AccountsService', () => {
  const prisma: any = {
    account: { count: jest.fn(), findMany: jest.fn(), findUnique: jest.fn() },
    $transaction: jest.fn((promises: Promise<unknown>[]) => Promise.all(promises)),
  };
  const service = new AccountsService(prisma);

  beforeEach(() => jest.clearAllMocks());

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
