import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Transaction, TransferResult } from './models';

@Injectable({ providedIn: 'root' })
export class TransfersApiService {
  private readonly http = inject(HttpClient);

  execute(payload: { fromAccountId: string; toAccountId: string; amount: number }, idempotencyKey: string) {
    return this.http.post<TransferResult>('/api/transfers', payload, {
      headers: { 'X-Idempotency-Key': idempotencyKey },
    });
  }

  findByAccount(accountId: string) {
    return this.http.get<Transaction[]>(`/api/transfers/account/${accountId}`);
  }
}
