import { Component, OnDestroy, OnInit, computed, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import * as DashboardActions from '../../state/dashboard/dashboard.actions';
import { selectByType, selectDashboardLoading, selectKpis } from '../../state/dashboard/dashboard.selectors';

interface KpiCard {
  label: string;
  value: string;
  accent: string;
  bar: string;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [AsyncPipe, BaseChartDirective],
  template: `
    <div class="max-w-6xl mx-auto p-6 space-y-8">
      <div class="flex items-center gap-3">
        <h2 class="font-display text-2xl font-bold text-stone-900">Dashboard</h2>
        <span class="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
          <span class="relative flex h-2 w-2">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
          </span>
          Tiempo real
        </span>
      </div>

      @if (kpis$ | async; as kpis) {
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          @for (card of cards(kpis); track card.label) {
            <div class="relative overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-stone-200/70 p-5">
              <span class="absolute inset-y-0 left-0 w-1" [class]="card.bar"></span>
              <p class="text-xs font-medium uppercase tracking-wide text-stone-500">{{ card.label }}</p>
              <p class="mt-1 font-display text-3xl font-bold text-stone-900">{{ card.value }}</p>
            </div>
          }
        </div>
      } @else {
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          @for (i of [1,2,3,4]; track i) {
            <div class="h-24 rounded-2xl bg-stone-200 animate-pulse"></div>
          }
        </div>
      }

      <div class="rounded-2xl bg-white shadow-sm ring-1 ring-stone-200/70 p-6">
        <h3 class="font-display font-semibold text-stone-900 mb-4">Cuentas por tipo</h3>
        <div class="h-72 max-w-md mx-auto">
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
    cutout: '62%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: { usePointStyle: true, pointStyle: 'circle', padding: 20 },
      },
      tooltip: {
        backgroundColor: '#1c1917',
        padding: 12,
        cornerRadius: 8,
      },
    },
  };

  // Paleta consistente con los badges de tipo de cuenta en toda la app.
  private readonly palette: Record<string, string> = {
    BASIC: '#a8a29e',
    PREMIUM: '#f59e0b',
    CORPORATE: '#059669',
  };

  protected readonly chartData = computed<ChartConfiguration<'doughnut'>['data']>(() => {
    const rows = this.byType();
    return {
      labels: rows.map((r) => r.type),
      datasets: [
        {
          data: rows.map((r) => r.count),
          backgroundColor: rows.map((r) => this.palette[r.type] ?? '#d6d3d1'),
          borderWidth: 2,
          borderColor: '#ffffff',
          hoverOffset: 6,
        },
      ],
    };
  });

  protected cards(kpis: {
    totalAccounts: number;
    totalBalance: string | number;
    transactionsToday: number;
    totalFeesCollected: string | number;
  }): KpiCard[] {
    const money = (v: string | number) => `$${Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    return [
      { label: 'Cuentas', value: String(kpis.totalAccounts), accent: 'text-emerald-600', bar: 'bg-emerald-500' },
      { label: 'Saldo total', value: money(kpis.totalBalance), accent: 'text-teal-600', bar: 'bg-teal-500' },
      { label: 'Transferencias hoy', value: String(kpis.transactionsToday), accent: 'text-amber-600', bar: 'bg-amber-500' },
      { label: 'Comisiones', value: money(kpis.totalFeesCollected), accent: 'text-stone-600', bar: 'bg-stone-400' },
    ];
  }

  ngOnInit() {
    this.store.dispatch(DashboardActions.enterDashboard());
    this.store.dispatch(DashboardActions.loadDashboard());
  }

  ngOnDestroy() {
    this.store.dispatch(DashboardActions.leaveDashboard());
  }
}
