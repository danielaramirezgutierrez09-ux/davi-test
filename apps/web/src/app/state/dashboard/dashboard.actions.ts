import { createAction, props } from '@ngrx/store';
import { AccountsByType, Kpis } from '../../core/models';

export const enterDashboard = createAction('[Dashboard] Enter');
export const leaveDashboard = createAction('[Dashboard] Leave');
export const loadDashboard = createAction('[Dashboard] Load');
export const loadDashboardSuccess = createAction(
  '[Dashboard] Load Success',
  props<{ kpis: Kpis; byType: AccountsByType[] }>(),
);
export const loadDashboardFailure = createAction('[Dashboard] Load Failure', props<{ error: string }>());
export const realtimeTick = createAction('[Dashboard] Realtime Tick');
