import { createFeatureSelector, createSelector } from '@ngrx/store';
import { TransfersState } from './transfers.reducer';

export const selectTransfersState = createFeatureSelector<TransfersState>('transfers');
export const selectLastTransaction = createSelector(selectTransfersState, (s) => s.lastTransaction);
export const selectTransferLoading = createSelector(selectTransfersState, (s) => s.loading);
export const selectTransferError = createSelector(selectTransfersState, (s) => s.error);
export const selectTransferDuplicated = createSelector(selectTransfersState, (s) => s.duplicated);
