import { createReducer, on } from '@ngrx/store';
import { Account } from '../../core/models';
import * as AccountsActions from './accounts.actions';

export interface AccountsState {
  data: Account[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  mine: Account[];
  loading: boolean;
  error: string | null;
}

export const initialState: AccountsState = {
  data: [],
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 0,
  mine: [],
  loading: false,
  error: null,
};

export const accountsReducer = createReducer(
  initialState,
  on(AccountsActions.loadAccounts, AccountsActions.loadMyAccounts, (state) => ({ ...state, loading: true, error: null })),
  on(AccountsActions.loadAccountsSuccess, (state, { result }) => ({
    ...state,
    data: result.data,
    total: result.meta.total,
    page: result.meta.page,
    limit: result.meta.limit,
    totalPages: result.meta.totalPages,
    loading: false,
  })),
  on(AccountsActions.loadMyAccountsSuccess, (state, { accounts }) => ({ ...state, mine: accounts, loading: false })),
  on(AccountsActions.loadAccountsFailure, AccountsActions.loadMyAccountsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),
);
