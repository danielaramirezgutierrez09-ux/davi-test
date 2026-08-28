import { AccountType } from '../../generated/prisma';

/** RN-03: commission per account level (Strategy pattern). */
export interface CommissionStrategy {
  readonly type: AccountType;
  /** Returns the fee for a given transfer amount. */
  calculate(amount: number): number;
}

export class BasicCommissionStrategy implements CommissionStrategy {
  readonly type = AccountType.BASIC;
  calculate(amount: number): number {
    return round2(amount * 0.02);
  }
}

export class PremiumCommissionStrategy implements CommissionStrategy {
  readonly type = AccountType.PREMIUM;
  calculate(): number {
    return 0;
  }
}

export class CorporateCommissionStrategy implements CommissionStrategy {
  readonly type = AccountType.CORPORATE;
  calculate(): number {
    return 5;
  }
}

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export class CommissionResolver {
  private readonly strategies = new Map<AccountType, CommissionStrategy>(
    [
      new BasicCommissionStrategy(),
      new PremiumCommissionStrategy(),
      new CorporateCommissionStrategy(),
    ].map((s) => [s.type, s]),
  );

  resolve(type: AccountType): CommissionStrategy {
    const strategy = this.strategies.get(type);
    if (!strategy) throw new Error(`No commission strategy for ${type}`);
    return strategy;
  }
}
