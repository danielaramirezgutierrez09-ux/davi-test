import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  const prisma: any = {
    account: { count: jest.fn(), aggregate: jest.fn(), groupBy: jest.fn() },
    transaction: { count: jest.fn(), aggregate: jest.fn() },
  };
  const service = new DashboardService(prisma);

  beforeEach(() => jest.clearAllMocks());

  it('kpis agrega métricas del día', async () => {
    prisma.account.count.mockResolvedValue(5);
    prisma.account.aggregate.mockResolvedValue({ _sum: { balance: 72400 } });
    prisma.transaction.count.mockResolvedValue(3);
    prisma.transaction.aggregate.mockResolvedValue({ _sum: { fee: 12 } });

    const kpis = await service.kpis();

    expect(kpis).toEqual({
      totalAccounts: 5,
      totalBalance: 72400,
      transactionsToday: 3,
      totalFeesCollected: 12,
    });
  });

  it('kpis maneja agregados nulos', async () => {
    prisma.account.count.mockResolvedValue(0);
    prisma.account.aggregate.mockResolvedValue({ _sum: { balance: null } });
    prisma.transaction.count.mockResolvedValue(0);
    prisma.transaction.aggregate.mockResolvedValue({ _sum: { fee: null } });
    const kpis = await service.kpis();
    expect(kpis.totalBalance).toBe(0);
    expect(kpis.totalFeesCollected).toBe(0);
  });

  it('accountsByType agrupa con totales', async () => {
    prisma.account.groupBy.mockResolvedValue([
      { type: 'BASIC', _count: { _all: 2 }, _sum: { balance: 1800 } },
      { type: 'PREMIUM', _count: { _all: 1 }, _sum: { balance: null } },
    ]);
    const res = await service.accountsByType();
    expect(res).toEqual([
      { type: 'BASIC', count: 2, totalBalance: 1800 },
      { type: 'PREMIUM', count: 1, totalBalance: 0 },
    ]);
  });
});
