import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

import { routes } from './app.routes';
import { authInterceptor } from './core/auth.interceptor';
import { authReducer } from './state/auth/auth.reducer';
import { AuthEffects } from './state/auth/auth.effects';
import { accountsReducer } from './state/accounts/accounts.reducer';
import { AccountsEffects } from './state/accounts/accounts.effects';
import { transfersReducer } from './state/transfers/transfers.reducer';
import { TransfersEffects } from './state/transfers/transfers.effects';
import { dashboardReducer } from './state/dashboard/dashboard.reducer';
import { DashboardEffects } from './state/dashboard/dashboard.effects';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideStore({
      auth: authReducer,
      accounts: accountsReducer,
      transfers: transfersReducer,
      dashboard: dashboardReducer,
    }),
    provideEffects([AuthEffects, AccountsEffects, TransfersEffects, DashboardEffects]),
    provideStoreDevtools({ maxAge: 25, logOnly: !isDevMode() }),
    provideCharts(withDefaultRegisterables()),
  ],
};
