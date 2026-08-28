export type Role = 'ADMIN' | 'CLIENT';
export type AccountType = 'BASIC' | 'PREMIUM' | 'CORPORATE';
export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'FAILED';

export interface Account {
  id: string;
  accountNumber: string;
  type: AccountType;
  balance: string | number;
  userId: string;
  user?: { fullName: string; email: string; avatarUrl: string | null };
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  avatarUrl: string | null;
  accounts: Account[];
}

export interface LoginResponse {
  accessToken: string;
  user: User;
}

export interface Transaction {
  id: string;
  idempotencyKey: string;
  fromAccountId: string;
  toAccountId: string;
  amount: string | number;
  fee: string | number;
  status: TransactionStatus;
  authorizationCode: string;
  failureReason: string | null;
  createdAt: string;
}

export interface TransferResult {
  transaction: Transaction;
  duplicated: boolean;
}

export interface PagedAccounts {
  data: Account[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface Kpis {
  totalAccounts: number;
  totalBalance: string | number;
  transactionsToday: number;
  totalFeesCollected: string | number;
}

export interface AccountsByType {
  type: AccountType;
  count: number;
  totalBalance: string | number;
}
