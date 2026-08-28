import { createAction, props } from '@ngrx/store';
import { TransferResult } from '../../core/models';

export const executeTransfer = createAction(
  '[Transfers] Execute',
  props<{ fromAccountId: string; toAccountId: string; amount: number; idempotencyKey: string }>(),
);
export const executeTransferSuccess = createAction('[Transfers] Execute Success', props<{ result: TransferResult }>());
export const executeTransferFailure = createAction('[Transfers] Execute Failure', props<{ error: string }>());
export const resetTransfer = createAction('[Transfers] Reset');
