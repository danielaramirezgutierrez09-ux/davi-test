import { createReducer, on } from '@ngrx/store';
import { AccountsByType, Kpis } from '../../core/models';
import * as DashboardActions from './dashboard.actions';

export interface DashboardState {
  kpis: Kpis | null;
  byType: AccountsByType[];
  connected: boolean;
  loading: boolean;
  error: string | null;
}

export const initialState: DashboardState = {
  kpis: null,
  byType: [],
  connected: false,
  loading: false,
  error: null,
};

export const dashboardReducer = createReducer(
  initialState,
  on(DashboardActions.enterDashboard, (state) => ({ ...state, connected: true })),
  on(DashboardActions.leaveDashboard, (state) => ({ ...state, connected: false })),
  on(DashboardActions.loadDashboard, (state) => ({ ...state, loading: true, error: null })),
  on(DashboardActions.loadDashboardSuccess, (state, { kpis, byType }) => ({
    ...state,
    kpis,
    byType,
    loading: false,
  })),
  on(DashboardActions.loadDashboardFailure, (state, { error }) => ({ ...state, loading: false, error })),
);
