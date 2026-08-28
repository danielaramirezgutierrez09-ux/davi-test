import { Component, computed, input, signal } from '@angular/core';

/** Avatar con skeleton de carga y fallback a iniciales. */
@Component({
  selector: 'app-avatar',
  standalone: true,
  template: `
    <div class="relative inline-flex items-center justify-center overflow-hidden rounded-full bg-indigo-100 text-indigo-700 font-semibold select-none"
         [style.width.px]="size()" [style.height.px]="size()" [style.font-size.px]="size() * 0.4">
      @if (loading()) {
        <div class="absolute inset-0 animate-pulse bg-gray-200 rounded-full"></div>
      }
      @if (src() && !failed()) {
        <img [src]="src()" [alt]="name()" class="absolute inset-0 h-full w-full object-cover"
             (load)="loading.set(false)" (error)="onError()" />
      } @else {
        <span>{{ initials() }}</span>
      }
    </div>
  `,
})
export class AvatarComponent {
  readonly src = input<string | null>(null);
  readonly name = input.required<string>();
  readonly size = input(40);

  protected readonly loading = signal(true);
  protected readonly failed = signal(false);

  protected readonly initials = computed(() =>
    this.name()
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]!.toUpperCase())
      .join(''),
  );

  protected onError() {
    this.failed.set(true);
    this.loading.set(false);
  }
}
