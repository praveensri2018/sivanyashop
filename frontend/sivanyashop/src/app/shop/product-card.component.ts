// src/app/shop/product-card.component.ts
// Place file at: src/app/shop/product-card.component.ts
// Product tile with image, discount badge, rating, and add-to-cart / view buttons.

import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product } from '../models/product';
import { RouterModule } from '@angular/router';
import { CartService } from '../services/cart.service';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <article class="card product-card h-100 border-0">
      <div class="card-body p-3 d-flex flex-column">

        <!-- IMAGE + BADGE -->
        <div class="position-relative">
          <img [src]="product.image || placeholder" class="img-fluid d-block mx-auto product-image" alt="{{ product.title }}" />
          <div *ngIf="hasDiscount()" class="discount-badge">-{{ discountPercent() }}%</div>

          <button class="btn btn-sm btn-light wishlist-btn" (click)="toggleWishlist($event)" title="Add to wishlist">
            <i [class]="'bi ' + (wish ? 'bi-heart-fill text-danger' : 'bi-heart')"></i>
          </button>
        </div>

        <!-- INFO -->
        <div class="mt-3 flex-grow-1">
          <a [routerLink]="['/product', product.id]" class="text-decoration-none text-dark">
            <h6 class="mb-1 product-title">{{ product.title }}</h6>
          </a>

          <div class="d-flex align-items-baseline gap-2 mb-2">
            <div class="price">₹{{ product.price }}</div>
            <div *ngIf="product.mrp" class="mrp text-muted">₹{{ product.mrp }}</div>
            <div *ngIf="product.rating" class="rating text-muted small ms-auto">
              <i class="bi bi-star-fill text-warning"></i> {{ product.rating }}
            </div>
          </div>

          <p class="small text-muted mb-0 line-clamp">{{ product.description || 'Great choice — stylish, comfy & affordable.' }}</p>
        </div>

        <!-- CTAs -->
        <div class="mt-3 d-flex gap-2">
          <button (click)="add()" class="btn btn-sm btn-primary flex-fill">Add to cart</button>
          <a [routerLink]="['/product', product.id]" class="btn btn-sm btn-outline-secondary">View</a>
        </div>
      </div>
    </article>
  `,
  styles: [`
    :host { display:block; }
    .product-card { border-radius: 12px; transition: transform .18s ease, box-shadow .18s ease; overflow: hidden; }
    .product-card:hover { transform: translateY(-8px); box-shadow: 0 18px 40px rgba(11,17,35,0.08); }

    .product-image { width: 100%; height: 180px; object-fit: cover; border-radius: 8px; background: linear-gradient(180deg,#fff,#f7fbff); }
    .discount-badge {
      position: absolute; top: 8px; left: 8px;
      background: linear-gradient(90deg,#ff7aa6,#ffb36b);
      color: white; padding: 4px 8px; border-radius: 999px; font-weight:700; font-size: .8rem;
      box-shadow: 0 6px 16px rgba(255,115,140,0.12);
    }
    .wishlist-btn {
      position: absolute; top: 8px; right: 8px; border-radius: 999px;
    }
    .price { font-weight: 700; color: #0b78d1; font-size: 1.05rem; }
    .mrp { text-decoration: line-through; }
    .line-clamp { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  `]
})
export class ProductCardComponent {
  @Input() product!: Product;
  placeholder = 'assets/placeholder-product.png'; // add a placeholder image in assets or change as needed
  wish = false;

  constructor(private cart: CartService) {}

  add() { this.cart.add(this.product, 1); }

  toggleWishlist(ev: Event) {
    ev.stopPropagation();
    ev.preventDefault();
    this.wish = !this.wish;
    // for now, just toggle UI; wire to a wishlist service if needed
  }

  hasDiscount(): boolean {
    return !!(this.product.mrp && this.product.mrp > this.product.price);
  }

  discountPercent(): number {
    if (!this.product.mrp || this.product.mrp <= this.product.price) return 0;
    return Math.round(((this.product.mrp - this.product.price) / this.product.mrp) * 100);
  }
}
