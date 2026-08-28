import { createReducer, on } from '@ngrx/store';
import { Transaction } from '../../core/models';
import * as TransfersActions from './transfers.actions';

export interface TransfersState {
  lastTransaction: Transaction | null;
  duplicated: boolean;
  loading: boolean;
  error: string | null;
}

export const initialState: TransfersState = {
  lastTransaction: null,
  duplicated: false,
  loading: false,
  error: null,
};

export const transfersReducer = createReducer(
  initialState,
  on(TransfersActions.executeTransfer, (state) => ({ ...state, loading: true, error: null })),
  on(TransfersActions.executeTransferSuccess, (state, { result }) => ({
    ...state,
    loading: false,
    lastTransaction: result.transaction,
    duplicated: result.duplicated,
  })),
  on(TransfersActions.executeTransferFailure, (state, { error }) => ({ ...state, loading: false, error })),
  on(TransfersActions.resetTransfer, () => initialState),
);
