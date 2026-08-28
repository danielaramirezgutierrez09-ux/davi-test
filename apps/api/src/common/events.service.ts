import { Injectable } from '@nestjs/common';
import { EventEmitter } from 'node:events';

export const TRANSACTION_EVENT = 'transaction.created';

export interface TransactionEventPayload {
  transactionId: string;
  status: string;
  amount: number;
}

/** In-process bus used to push realtime updates to the SSE dashboard stream. */
@Injectable()
export class EventsService {
  readonly emitter = new EventEmitter();

  emitTransaction(payload: TransactionEventPayload) {
    this.emitter.emit(TRANSACTION_EVENT, payload);
  }
}
