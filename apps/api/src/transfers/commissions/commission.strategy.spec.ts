import { AccountType } from '../../generated/prisma';
import {
  BasicCommissionStrategy,
  CommissionResolver,
  CorporateCommissionStrategy,
  PremiumCommissionStrategy,
  round2,
} from './commission.strategy';

describe('CommissionStrategy (RN-03)', () => {
  it('BASIC cobra 2% del monto', () => {
    expect(new BasicCommissionStrategy().calculate(100)).toBe(2);
    expect(new BasicCommissionStrategy().calculate(33.33)).toBe(0.67);
  });

  it('PREMIUM no cobra comisión', () => {
    expect(new PremiumCommissionStrategy().calculate(9999)).toBe(0);
  });

  it('CORPORATE cobra $5 fijos', () => {
    expect(new CorporateCommissionStrategy().calculate(10)).toBe(5);
    expect(new CorporateCommissionStrategy().calculate(100000)).toBe(5);
  });

  it('resolver devuelve la estrategia correcta por tipo', () => {
    const resolver = new CommissionResolver();
    expect(resolver.resolve(AccountType.BASIC)).toBeInstanceOf(BasicCommissionStrategy);
    expect(resolver.resolve(AccountType.PREMIUM)).toBeInstanceOf(PremiumCommissionStrategy);
    expect(resolver.resolve(AccountType.CORPORATE)).toBeInstanceOf(CorporateCommissionStrategy);
  });

  it('round2 evita errores de punto flotante', () => {
    expect(round2(0.1 + 0.2)).toBe(0.3);
  });
});
