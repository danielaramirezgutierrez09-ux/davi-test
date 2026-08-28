import { ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AntiFraudService } from './antifraud.service';

describe('AntiFraudService (RN-02)', () => {
  const context = { fromAccountId: 'a', toAccountId: 'b', amount: 100 };

  it('resuelve cuando el screening termina antes del timeout', async () => {
    const service = new AntiFraudService(new ConfigService({ ANTIFRAUD_TIMEOUT_MS: 3000 }));
    (service as any).simulateScreening = jest
      .fn()
      .mockResolvedValue({ approved: true, score: 0.42 });
    await expect(service.check(context)).resolves.toEqual({ approved: true, score: 0.42 });
  });

  it('lanza 503 limpio cuando el screening excede el timeout', async () => {
    const service = new AntiFraudService(new ConfigService({ ANTIFRAUD_TIMEOUT_MS: 50 }));
    (service as any).simulateScreening = jest
      .fn()
      .mockImplementation(() => new Promise((r) => setTimeout(r, 500)));
    await expect(service.check(context)).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('usa 3000ms por defecto', () => {
    const service = new AntiFraudService(new ConfigService());
    expect((service as any).timeoutMs).toBe(3000);
  });

  it('screening simulado tarda entre 1s y 10s y aprueba montos normales', async () => {
    jest.useFakeTimers();
    const service = new AntiFraudService(new ConfigService());
    const promise = (service as any).simulateScreening({ amount: 50 });
    jest.advanceTimersByTime(10000);
    const result = await promise;
    expect(result.approved).toBe(true);
    jest.useRealTimers();
  });

  it('screening simulado puede rechazar montos altos', async () => {
    jest.useFakeTimers();
    jest.spyOn(Math, 'random').mockReturnValue(0);
    const service = new AntiFraudService(new ConfigService());
    const promise = (service as any).simulateScreening({ amount: 200000 });
    jest.advanceTimersByTime(10000);
    const result = await promise;
    expect(result.approved).toBe(false);
    jest.restoreAllMocks();
    jest.useRealTimers();
  });
});
