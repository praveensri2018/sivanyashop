// src/app/shop/product-detail.component.ts
// Place file at: src/app/shop/product-detail.component.ts
// Product detail: loads product in ngOnInit, shows gallery, price, qty controls and add-to-cart.
// (Fixed template type-checker error by using safe-navigation + null-coalescing in the tags length check)

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ProductService } from '../services/product.service';
import { CartService } from '../services/cart.service';
import { Product } from '../models/product';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div *ngIf="product; else notFound" class="row g-4">
      <!-- left: image -->
      <div class="col-12 col-md-5">
        <div class="card p-3">
          <img [src]="product.image || placeholder" class="img-fluid d-block mx-auto detail-image" alt="{{ product.title }}" />
          <div class="mt-2 d-flex gap-2">
            <img *ngFor="let thumb of thumbnails" [src]="thumb" class="thumb" (click)="selectThumb(thumb)" />
          </div>
        </div>
      </div>

      <!-- right: details -->
      <div class="col-12 col-md-7">
        <h2 class="mb-2">{{ product.title }}</h2>

        <div class="d-flex align-items-baseline gap-3 mb-3">
          <div class="h4 mb-0 price">₹{{ product.price }}</div>
          <div *ngIf="product.mrp" class="text-muted small mrp">₹{{ product.mrp }}</div>
          <div *ngIf="product.mrp" class="badge rounded-pill bg-warning text-dark">Save {{ discountPercent() }}%</div>
          <div class="ms-auto small text-muted"><i class="bi bi-star-fill text-warning"></i> {{ product.rating || '—' }}</div>
        </div>

        <p class="text-muted mb-3">{{ product.description || 'This is a lovely item — comfy, stylish and trending.' }}</p>

        <div class="d-flex align-items-center gap-3 mb-3">
          <div class="input-group" style="max-width:140px;">
            <button class="btn btn-outline-secondary" (click)="changeQty(qty - 1)">-</button>
            <input class="form-control text-center" [value]="qty" readonly />
            <button class="btn btn-outline-secondary" (click)="changeQty(qty + 1)">+</button>
          </div>

          <button class="btn btn-lg btn-primary" (click)="addToCart()">Add to cart</button>
          <button class="btn btn-outline-secondary">Buy now</button>
        </div>

        <div class="mt-4">
          <h6>Product details</h6>
          <ul class="small text-muted">
            <!-- use safe-navigation + null-coalescing to satisfy the template type-checker -->
            <li *ngIf="product.tags?.length">
              Tags:
              <span *ngFor="let t of product.tags; let i = index">
                {{ t }}
                <span *ngIf="i < ((product.tags?.length ?? 0) - 1)">, </span>
              </span>
            </li>
            <li>Category: {{ product.category || 'General' }}</li>
            <li *ngIf="product.mrp">Returnable in 7 days</li>
          </ul>
        </div>
      </div>

      <!-- related (simple) -->
      <div class="col-12 mt-4">
        <h5>Related products</h5>
        <div class="d-flex gap-3 overflow-auto pb-2">
          <ng-container *ngFor="let r of related">
            <a [routerLink]="['/product', r.id]" class="text-decoration-none" style="min-width:200px;">
              <div class="card p-2">
                <img [src]="r.image || placeholder" class="img-fluid" style="height:120px; object-fit:cover;" />
                <div class="small text-dark mt-2">{{ r.title }}</div>
                <div class="small text-muted">₹{{ r.price }}</div>
              </div>
            </a>
          </ng-container>
        </div>
      </div>
    </div>

    <ng-template #notFound>
      <div class="text-center py-6">
        <h5>Product not found</h5>
        <a routerLink="/" class="btn btn-link">Back to shop</a>
      </div>
    </ng-template>
  `,
  styles: [`
    :host { display:block; }
    .detail-image { width:100%; height:420px; object-fit:cover; border-radius:8px; }
    .thumb { width:64px; height:64px; object-fit:cover; border-radius:6px; cursor:pointer; border:1px solid #eee; }
    .thumb:hover { transform: translateY(-4px); box-shadow: 0 10px 30px rgba(11,17,35,0.06); }
    .price { color: #0b78d1; }
    .mrp { text-decoration: line-through; margin-top: .4rem; }
  `]
})
export class ProductDetailComponent implements OnInit {
  product?: Product | null;
  placeholder = 'assets/placeholder-product.png';
  qty = 1;
  thumbnails: string[] = [];
  related: Product[] = [];

  constructor(
    private route: ActivatedRoute,
    private ps: ProductService,
    private cart: CartService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') || '';
    this.product = this.ps.getById(id) ?? null;

    if (this.product) {
      // thumbnail array: use product.image or duplicates
      const base = this.product.image || this.placeholder;
      this.thumbnails = [base, base, base].slice(0, 3);
      // simple related items: take other products (first 8 excluding current)
      this.related = this.ps.getAll().filter(p => p.id !== this.product!.id).slice(0, 8);
    }
  }

  changeQty(n: number) {
    this.qty = Math.max(1, Math.min(10, n));
  }

  addToCart() {
    if (!this.product) return;
    this.cart.add(this.product, this.qty);
  }

  selectThumb(url: string) {
    // swap main image to selected thumbnail
    if (this.product) {
      this.product.image = url;
    }
  }

  discountPercent(): number {
    if (!this.product?.mrp) return 0;
    const mrp = this.product.mrp;
    return Math.round(((mrp - this.product!.price) / mrp) * 100);
  }
}
