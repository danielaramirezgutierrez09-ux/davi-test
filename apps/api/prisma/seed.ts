import { PrismaClient, Role, AccountType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('Password123!', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@findash.com' },
    update: {},
    create: {
      email: 'admin@findash.com',
      password,
      fullName: 'Admin FinDash',
      role: Role.ADMIN,
      avatarUrl: 'https://i.pravatar.cc/150?u=admin@findash.com',
    },
  });

  const clients: { email: string; name: string; type: AccountType; balance: number }[] = [
    { email: 'ana@findash.com', name: 'Ana Gómez', type: AccountType.BASIC, balance: 1500 },
    { email: 'luis@findash.com', name: 'Luis Pérez', type: AccountType.PREMIUM, balance: 8200 },
    { email: 'corp@findash.com', name: 'Corp S.A.S', type: AccountType.CORPORATE, balance: 50000 },
    { email: 'maria@findash.com', name: 'María Rojas', type: AccountType.BASIC, balance: 300 },
    { email: 'juan@findash.com', name: 'Juan Díaz', type: AccountType.PREMIUM, balance: 12400 },
  ];

  let seq = 1001;
  for (const c of clients) {
    const user = await prisma.user.upsert({
      where: { email: c.email },
      update: {},
      create: {
        email: c.email,
        password,
        fullName: c.name,
        role: Role.CLIENT,
        avatarUrl: `https://i.pravatar.cc/150?u=${c.email}`,
      },
    });
    const accountNumber = `FD-${seq++}`;
    await prisma.account.upsert({
      where: { accountNumber },
      update: {},
      create: {
        accountNumber,
        type: c.type,
        balance: c.balance,
        userId: user.id,
      },
    });
  }

  console.log('Seed OK. admin:', admin.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
