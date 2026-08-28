import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AccountsState } from './accounts.reducer';

export const selectAccountsState = createFeatureSelector<AccountsState>('accounts');
export const selectAccounts = createSelector(selectAccountsState, (s) => s.data);
export const selectAccountsMeta = createSelector(selectAccountsState, (s) => ({
  total: s.total,
  page: s.page,
  limit: s.limit,
  totalPages: s.totalPages,
}));
export const selectMyAccounts = createSelector(selectAccountsState, (s) => s.mine);
export const selectAccountsLoading = createSelector(selectAccountsState, (s) => s.loading);
