import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Store } from '@ngrx/store';
import { AvatarComponent } from '../shared/avatar.component';
import * as AuthActions from '../state/auth/auth.actions';
import { selectIsAdmin, selectUser } from '../state/auth/auth.selectors';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, AsyncPipe, AvatarComponent],
  template: `
    <nav class="bg-white shadow-sm">
      <div class="max-w-6xl mx-auto flex items-center gap-6 px-6 py-3">
        <span class="font-bold text-emerald-700">FinDash</span>
        @if (isAdmin$ | async) {
          <a routerLink="/admin" routerLinkActive="text-emerald-700 font-medium"
             [routerLinkActiveOptions]="{ exact: true }" class="text-gray-600">Cuentas</a>
          <a routerLink="/admin/dashboard" routerLinkActive="text-emerald-700 font-medium"
             class="text-gray-600">Dashboard</a>
        } @else {
          <a routerLink="/" routerLinkActive="text-emerald-700 font-medium" class="text-gray-600">Mis cuentas</a>
        }
        <div class="ml-auto flex items-center gap-3">
          @if (user$ | async; as user) {
            <app-avatar [src]="user.avatarUrl" [name]="user.fullName" [size]="32" />
            <span class="text-sm text-gray-600 hidden sm:inline">{{ user.fullName }}</span>
          }
          <button (click)="logout()" class="text-sm text-red-600 hover:underline">Salir</button>
        </div>
      </div>
    </nav>
    <router-outlet />
  `,
})
export class LayoutComponent {
  private readonly store = inject(Store);
  protected readonly user$ = this.store.select(selectUser);
  protected readonly isAdmin$ = this.store.select(selectIsAdmin);

  protected logout() {
    this.store.dispatch(AuthActions.logout());
  }
}
