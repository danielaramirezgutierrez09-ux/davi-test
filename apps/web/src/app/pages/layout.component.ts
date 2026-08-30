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
    <nav class="sticky top-0 z-20 border-b border-stone-200/80 bg-white/85 backdrop-blur">
      <div class="max-w-6xl mx-auto flex items-center gap-2 px-6 py-2.5">
        <a routerLink="/" class="flex items-center gap-2 mr-4">
          <span class="grid h-8 w-8 place-items-center rounded-lg bg-emerald-600 font-display text-sm font-bold text-white">F</span>
          <span class="font-display text-lg font-bold tracking-tight text-stone-900">FinDash</span>
        </a>

        @if (isAdmin$ | async) {
          <a routerLink="/admin" [routerLinkActiveOptions]="{ exact: true }"
             routerLinkActive="bg-emerald-100 text-emerald-800"
             class="rounded-full px-3.5 py-1.5 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-900">
            Cuentas
          </a>
          <a routerLink="/admin/dashboard" routerLinkActive="bg-emerald-100 text-emerald-800"
             class="rounded-full px-3.5 py-1.5 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-900">
            Dashboard
          </a>
        } @else {
          <a routerLink="/" routerLinkActive="bg-emerald-100 text-emerald-800"
             class="rounded-full px-3.5 py-1.5 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-900">
            Mis cuentas
          </a>
        }

        <div class="ml-auto flex items-center gap-3">
          @if (user$ | async; as user) {
            <div class="flex items-center gap-2.5 rounded-full border border-stone-200 bg-white py-1 pl-1 pr-3">
              <app-avatar [src]="user.avatarUrl" [name]="user.fullName" [size]="28" />
              <span class="text-sm font-medium text-stone-700 hidden sm:inline">{{ user.fullName }}</span>
            </div>
          }
          <button (click)="logout()"
                  class="rounded-full px-3.5 py-1.5 text-sm font-medium text-stone-500 transition-colors hover:bg-red-50 hover:text-red-600">
            Salir
          </button>
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
