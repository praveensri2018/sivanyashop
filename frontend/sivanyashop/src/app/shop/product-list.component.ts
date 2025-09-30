// src/app/shop/product-list.component.ts
// Place file at: src/app/shop/product-list.component.ts
// Product list: loads products from ProductService in ngOnInit to avoid injection-before-init.

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductService } from '../services/product.service';
import { ProductCardComponent } from './product-card.component';
import { Product } from '../models/product';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, ProductCardComponent],
  template: `
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h4 class="mb-0">Trending for you</h4>
      <div class="text-muted small">Showing {{ products.length }} items</div>
    </div>

    <div class="products-grid">
      <ng-container *ngFor="let p of products">
        <app-product-card [product]="p"></app-product-card>
      </ng-container>
    </div>

    <div *ngIf="!products.length" class="text-center text-muted py-6">No products available.</div>
  `,
  styles: [`
    :host { display:block; }
    .products-grid {
      display: grid;
      gap: 1rem;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    }
  `]
})
export class ProductListComponent implements OnInit {
  products: Product[] = [];

  constructor(private productService: ProductService) {}

  ngOnInit(): void {
    // load products (service currently returns static list)
    this.products = this.productService.getAll();
  }
}
