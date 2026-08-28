import { Component, OnInit, inject, signal } from '@angular/core';
import { AsyncPipe, DecimalPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { AvatarComponent } from '../../shared/avatar.component';
import { AccountType } from '../../core/models';
import * as AccountsActions from '../../state/accounts/accounts.actions';
import {
  selectAccounts,
  selectAccountsLoading,
  selectAccountsMeta,
} from '../../state/accounts/accounts.selectors';

@Component({
  selector: 'app-admin-accounts',
  standalone: true,
  imports: [AsyncPipe, DecimalPipe, AvatarComponent],
  template: `
    <div class="max-w-6xl mx-auto p-6 space-y-6">
      <div class="flex flex-wrap items-center gap-3">
        <h2 class="text-xl font-bold mr-auto">Cuentas</h2>
        <input #searchInput placeholder="Buscar nombre, email o n° cuenta"
               (keyup.enter)="applyFilters(searchInput.value, typeSelect.value)"
               class="border rounded-lg px-3 py-2 w-72" />
        <select #typeSelect (change)="applyFilters(searchInput.value, typeSelect.value)"
                class="border rounded-lg px-3 py-2">
          <option value="">Todos los tipos</option>
          <option value="BASIC">BASIC</option>
          <option value="PREMIUM">PREMIUM</option>
          <option value="CORPORATE">CORPORATE</option>
        </select>
      </div>

      <div class="rounded-xl bg-white shadow overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 text-left text-gray-500">
            <tr>
              <th class="px-4 py-3">Titular</th>
              <th class="px-4 py-3">N° cuenta</th>
              <th class="px-4 py-3">Tipo</th>
              <th class="px-4 py-3 text-right">Saldo</th>
            </tr>
          </thead>
          <tbody>
            @if (loading$ | async) {
              @for (row of [1,2,3,4,5]; track row) {
                <tr><td colspan="4" class="px-4 py-3"><div class="h-6 bg-gray-100 rounded animate-pulse"></div></td></tr>
              }
            } @else {
              @for (acc of accounts$ | async; track acc.id) {
                <tr class="border-t hover:bg-gray-50">
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-3">
                      <app-avatar [src]="acc.user?.avatarUrl ?? null" [name]="acc.user?.fullName ?? '?'" [size]="36" />
                      <div>
                        <p class="font-medium">{{ acc.user?.fullName }}</p>
                        <p class="text-xs text-gray-500">{{ acc.user?.email }}</p>
                      </div>
                    </div>
                  </td>
                  <td class="px-4 py-3">{{ acc.accountNumber }}</td>
                  <td class="px-4 py-3">{{ acc.type }}</td>
                  <td class="px-4 py-3 text-right font-medium">\${{ acc.balance | number:'1.2-2' }}</td>
                </tr>
              } @empty {
                <tr><td colspan="4" class="px-4 py-8 text-center text-gray-400">Sin resultados</td></tr>
              }
            }
          </tbody>
        </table>
      </div>

      @if (meta$ | async; as meta) {
        <div class="flex items-center justify-between text-sm">
          <span class="text-gray-500">{{ meta.total }} cuentas · página {{ meta.page }} de {{ meta.totalPages }}</span>
          <div class="space-x-2">
            <button (click)="goTo(meta.page - 1)" [disabled]="meta.page <= 1"
                    class="px-3 py-1 border rounded-lg disabled:opacity-40">Anterior</button>
            <button (click)="goTo(meta.page + 1)" [disabled]="meta.page >= meta.totalPages"
                    class="px-3 py-1 border rounded-lg disabled:opacity-40">Siguiente</button>
          </div>
        </div>
      }
    </div>
  `,
})
export class AdminAccountsComponent implements OnInit {
  private readonly store = inject(Store);

  protected readonly accounts$ = this.store.select(selectAccounts);
  protected readonly meta$ = this.store.select(selectAccountsMeta);
  protected readonly loading$ = this.store.select(selectAccountsLoading);

  private readonly search = signal('');
  private readonly type = signal<AccountType | undefined>(undefined);

  ngOnInit() {
    this.load(1);
  }

  protected applyFilters(search: string, type: string) {
    this.search.set(search);
    this.type.set((type as AccountType) || undefined);
    this.load(1);
  }

  protected goTo(page: number) {
    this.load(page);
  }

  private load(page: number) {
    this.store.dispatch(
      AccountsActions.loadAccounts({
        page,
        limit: 10,
        search: this.search() || undefined,
        type: this.type(),
      }),
    );
  }
}
