import { AccountType } from './models';

// Replica RN-03 del backend (Strategy): BASIC 2%, PREMIUM 0%, CORPORATE $5 fijos.
const round2 = (v: number) => Math.round((v + Number.EPSILON) * 100) / 100;

export function calcFee(type: AccountType | undefined, amount: number): number {
  if (!type || !amount || amount <= 0) return 0;
  switch (type) {
    case 'BASIC':
      return round2(amount * 0.02);
    case 'PREMIUM':
      return 0;
    case 'CORPORATE':
      return 5;
    default:
      return 0;
  }
}

export function feeLabel(type: AccountType | undefined): string {
  switch (type) {
    case 'BASIC':
      return '2% del monto';
    case 'PREMIUM':
      return 'Sin comisión';
    case 'CORPORATE':
      return '$5.00 fijos';
    default:
      return '';
  }
}
