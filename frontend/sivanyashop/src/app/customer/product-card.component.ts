
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
  <article class="cd-card" (click)="open()">
    <div class="img-wrap">
      <img [src]="image || '/assets/no-image.jpg'" alt="{{ title }}" (error)="($event.target as HTMLImageElement).src='/assets/no-image.jpg'"/>
    </div>
    <div class="meta">
      <h5 class="title">{{ title }}</h5>
      <p class="desc">{{ desc }}</p>
      <div class="row">
        <strong class="price" *ngIf="price">₹ {{ price }}</strong>
        <small class="status" [class.inactive]="!isActive">{{ isActive ? 'Available' : 'Unavailable' }}</small>
      </div>
    </div>
  </article>
  `,
  styles: [`
    :host { display:block; }
    .cd-card { border-radius:10px; border:1px solid #eee; overflow:hidden; cursor:pointer; background:#fff; }
    .img-wrap{ height:140px; display:flex; align-items:center; justify-content:center; background:#fafafa; }
    .img-wrap img{ width:100%; height:100%; object-fit:cover; }
    .meta{ padding:8px; }
    .title{ margin:0; font-size:0.95rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .desc{ margin:6px 0 8px; font-size:0.82rem; color:#6b7280; height:32px; overflow:hidden; }
    .row{ display:flex; justify-content:space-between; align-items:center; }
    .price{ color:#0d6efd; font-weight:700; }
    .status{ font-size:0.78rem; padding:4px 8px; border-radius:999px; background:#e6f7ec; color:#128a3d; }
    .status.inactive{ background:#fff3f2; color:#a12b2b; }
  `]
})
export class ProductCardComponent {
  @Input() id!: number;
  @Input() title = '';
  @Input() desc = '';
  @Input() price: number | null = null;
  @Input() image: string | null = null;
  @Input() isActive = true;

  open() {
    // let parent handle navigation; we still emit via window location for quick use
    try { window.location.href = `/product/${this.id}`; } catch { /* ignore */ }
  }
}
