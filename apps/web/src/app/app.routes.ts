import { Routes } from '@angular/router';
import { authGuard, adminGuard } from './core/guards';
import { LayoutComponent } from './pages/layout.component';
import { LoginComponent } from './pages/login/login.component';
import { ClientHomeComponent } from './pages/client/client-home.component';
import { AdminAccountsComponent } from './pages/admin/admin-accounts.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', component: ClientHomeComponent },
      { path: 'admin', component: AdminAccountsComponent, canActivate: [adminGuard] },
      {
        path: 'admin/dashboard',
        // Lazy loading: el dashboard solo se descarga para admins.
        loadComponent: () =>
          import('./pages/admin/admin-dashboard.component').then((m) => m.AdminDashboardComponent),
        canActivate: [adminGuard],
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
