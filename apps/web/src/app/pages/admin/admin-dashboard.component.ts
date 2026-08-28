import { Component, OnDestroy, OnInit, computed, inject } from '@angular/core';
import { AsyncPipe, DecimalPipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import * as DashboardActions from '../../state/dashboard/dashboard.actions';
import { selectByType, selectDashboardLoading, selectKpis } from '../../state/dashboard/dashboard.selectors';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [AsyncPipe, DecimalPipe, BaseChartDirective],
  template: `
    <div class="max-w-6xl mx-auto p-6 space-y-6">
      <h2 class="text-xl font-bold">Dashboard en tiempo real</h2>

      @if (kpis$ | async; as kpis) {
        <div class="grid gap-4 sm:grid-cols-4">
          <div class="rounded-xl bg-white shadow p-5">
            <p class="text-sm text-gray-500">Cuentas</p>
            <p class="text-2xl font-bold">{{ kpis.totalAccounts }}</p>
          </div>
          <div class="rounded-xl bg-white shadow p-5">
            <p class="text-sm text-gray-500">Saldo total</p>
            <p class="text-2xl font-bold">\${{ kpis.totalBalance | number:'1.2-2' }}</p>
          </div>
          <div class="rounded-xl bg-white shadow p-5">
            <p class="text-sm text-gray-500">Transferencias hoy</p>
            <p class="text-2xl font-bold">{{ kpis.transactionsToday }}</p>
          </div>
          <div class="rounded-xl bg-white shadow p-5">
            <p class="text-sm text-gray-500">Comisiones</p>
            <p class="text-2xl font-bold">\${{ kpis.totalFeesCollected | number:'1.2-2' }}</p>
          </div>
        </div>
      } @else {
        <div class="grid gap-4 sm:grid-cols-4">
          @for (i of [1,2,3,4]; track i) {
            <div class="h-24 rounded-xl bg-gray-200 animate-pulse"></div>
          }
        </div>
      }

      <div class="rounded-xl bg-white shadow p-6">
        <h3 class="font-semibold mb-4">Cuentas por tipo</h3>
        <div class="h-64">
          <canvas baseChart [data]="chartData()" [options]="chartOptions" type="doughnut"></canvas>
        </div>
      </div>
    </div>
  `,
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  private readonly store = inject(Store);

  protected readonly kpis$ = this.store.select(selectKpis);
  protected readonly loading$ = this.store.select(selectDashboardLoading);
  private readonly byType = toSignal(this.store.select(selectByType), { initialValue: [] });

  protected readonly chartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
  };

  protected readonly chartData = computed<ChartConfiguration<'doughnut'>['data']>(() => {
    const rows = this.byType();
    return {
      labels: rows.map((r) => r.type),
      datasets: [
        {
          data: rows.map((r) => r.count),
          backgroundColor: ['#6366f1', '#f59e0b', '#10b981'],
        },
      ],
    };
  });

  ngOnInit() {
    this.store.dispatch(DashboardActions.enterDashboard());
    this.store.dispatch(DashboardActions.loadDashboard());
  }

  ngOnDestroy() {
    this.store.dispatch(DashboardActions.leaveDashboard());
  }
}
