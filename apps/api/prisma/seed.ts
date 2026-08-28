import 'dotenv/config';
import { PrismaClient, Role, AccountType } from '../src/generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

/** Avatar genérico servido por el frontend (apps/web/public/avatar.svg). */
const AVATAR = '/avatar.svg';

async function main() {
  const password = await bcrypt.hash('Password123!', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@findash.com' },
    update: { avatarUrl: AVATAR },
    create: {
      email: 'admin@findash.com',
      password: password,
      fullName: 'Admin FinDash',
      role: Role.ADMIN,
      avatarUrl: AVATAR,
    },
  });

  const clients: { email: string; name: string; type: AccountType; balance: number }[] = [
    { email: 'ana@findash.com', name: 'Ana Gómez', type: AccountType.BASIC, balance: 1500 },
    { email: 'luis@findash.com', name: 'Luis Pérez', type: AccountType.PREMIUM, balance: 8200 },
    { email: 'corp@findash.com', name: 'Corp S.A.S', type: AccountType.CORPORATE, balance: 50000 },
    { email: 'maria@findash.com', name: 'María Rojas', type: AccountType.BASIC, balance: 300 },
    { email: 'juan@findash.com', name: 'Juan Díaz', type: AccountType.PREMIUM, balance: 12400 },
    { email: 'carla@findash.com', name: 'Carla Ruiz', type: AccountType.PREMIUM, balance: 9600 },
    { email: 'pedro@findash.com', name: 'Pedro Niño', type: AccountType.CORPORATE, balance: 73000 },
    { email: 'sofia@findash.com', name: 'Sofía Vega', type: AccountType.PREMIUM, balance: 5400 },
    { email: 'andres@findash.com', name: 'Andrés Mora', type: AccountType.CORPORATE, balance: 128000 },
  ];

  let seq = 1001;
  for (const c of clients) {
    const user = await prisma.user.upsert({
      where: { email: c.email },
      update: { avatarUrl: AVATAR },
      create: {
        email: c.email,
        password: password,
        fullName: c.name,
        role: Role.CLIENT,
        avatarUrl: AVATAR,
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

  console.log('Seed OK. admin:', admin.email, '| clientes:', clients.length);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
