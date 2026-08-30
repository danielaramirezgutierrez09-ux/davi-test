import { createAction, props } from '@ngrx/store';
import { Account, AccountType, PagedAccounts } from '../../core/models';

export const loadAccounts = createAction(
  '[Accounts] Load',
  // OJO: el prop NO puede llamarse `type` — colisiona con el discriminante
  // `type` de la acción NgRx y el filtro se pierde.
  props<{ page: number; limit: number; accountType?: AccountType; search?: string }>(),
);
export const loadAccountsSuccess = createAction('[Accounts] Load Success', props<{ result: PagedAccounts }>());
export const loadAccountsFailure = createAction('[Accounts] Load Failure', props<{ error: string }>());

export const loadMyAccounts = createAction('[Accounts] Load Mine');
export const loadMyAccountsSuccess = createAction('[Accounts] Load Mine Success', props<{ accounts: Account[] }>());
export const loadMyAccountsFailure = createAction('[Accounts] Load Mine Failure', props<{ error: string }>());

export const createAccountUser = createAction(
  '[Accounts] Create User Account',
  props<{ payload: { fullName: string; email: string; password: string; type: AccountType; initialBalance?: number } }>(),
);
export const createAccountUserSuccess = createAction('[Accounts] Create User Account Success', props<{ ok: true }>());
export const createAccountUserFailure = createAction('[Accounts] Create User Account Failure', props<{ error: string }>());

