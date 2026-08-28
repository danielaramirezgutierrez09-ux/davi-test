import { createAction, props } from '@ngrx/store';
import { Account, AccountType, PagedAccounts } from '../../core/models';

export const loadAccounts = createAction(
  '[Accounts] Load',
  props<{ page: number; limit: number; type?: AccountType; search?: string }>(),
);
export const loadAccountsSuccess = createAction('[Accounts] Load Success', props<{ result: PagedAccounts }>());
export const loadAccountsFailure = createAction('[Accounts] Load Failure', props<{ error: string }>());

export const loadMyAccounts = createAction('[Accounts] Load Mine');
export const loadMyAccountsSuccess = createAction('[Accounts] Load Mine Success', props<{ accounts: Account[] }>());
export const loadMyAccountsFailure = createAction('[Accounts] Load Mine Failure', props<{ error: string }>());
