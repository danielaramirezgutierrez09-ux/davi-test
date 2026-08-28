import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async kpis() {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [accounts, balanceAgg, todayTx, feesAgg] = await Promise.all([
      this.prisma.account.count(),
      this.prisma.account.aggregate({ _sum: { balance: true } }),
      this.prisma.transaction.count({
        where: { createdAt: { gte: startOfDay }, status: 'COMPLETED' },
      }),
      this.prisma.transaction.aggregate({
        _sum: { fee: true },
        where: { status: 'COMPLETED' },
      }),
    ]);

    return {
      totalAccounts: accounts,
      totalBalance: balanceAgg._sum.balance ?? 0,
      transactionsToday: todayTx,
      totalFeesCollected: feesAgg._sum.fee ?? 0,
    };
  }

  async accountsByType() {
    const grouped = await this.prisma.account.groupBy({
      by: ['type'],
      _count: { _all: true },
      _sum: { balance: true },
    });
    return grouped.map((g) => ({
      type: g.type,
      count: g._count._all,
      totalBalance: g._sum.balance ?? 0,
    }));
  }
}
