import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * RN-02: simulated anti-fraud screening.
 * Resolves in 1-10s (random). Calls are bounded by ANTIFRAUD_TIMEOUT_MS
 * (default 3s); on timeout the transfer is aborted cleanly.
 */
@Injectable()
export class AntiFraudService {
  private readonly timeoutMs: number;

  constructor(config: ConfigService) {
    this.timeoutMs = config.get<number>('ANTIFRAUD_TIMEOUT_MS', 3000);
  }

  async check(transactionContext: {
    fromAccountId: string;
    toAccountId: string;
    amount: number;
  }): Promise<{ approved: boolean; score: number }> {
    const screening = this.simulateScreening(transactionContext);
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new ServiceUnavailableException('Anti-fraud screening timed out')),
        this.timeoutMs,
      ),
    );
    return Promise.race([screening, timeout]);
  }

  private async simulateScreening(context: {
    amount: number;
  }): Promise<{ approved: boolean; score: number }> {
    const delayMs = 1000 + Math.random() * 9000;
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    const score = Math.random();
    return { approved: context.amount < 100000 || score > 0.1, score };
  }
}
