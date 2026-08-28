import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { QueryAccountsDto } from './dto/query-accounts.dto';

@Injectable()
export class AccountsService {
  constructor(private readonly prisma: PrismaService) {}

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
