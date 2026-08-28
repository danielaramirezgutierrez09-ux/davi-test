import { createFeatureSelector, createSelector } from '@ngrx/store';
import { DashboardState } from './dashboard.reducer';

export const selectDashboardState = createFeatureSelector<DashboardState>('dashboard');
export const selectKpis = createSelector(selectDashboardState, (s) => s.kpis);
export const selectByType = createSelector(selectDashboardState, (s) => s.byType);
export const selectDashboardLoading = createSelector(selectDashboardState, (s) => s.loading);
