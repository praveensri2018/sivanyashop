// src/app/shop/shop.component.ts
// Place file at: src/app/shop/shop.component.ts

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductListComponent } from './product-list.component';

@Component({
  selector: 'app-shop',
  standalone: true,
  imports: [CommonModule, ProductListComponent],
  template: `
    <section>
      <h3 class="mb-3">Trending Products</h3>
      <app-product-list></app-product-list>
    </section>
  `
})
export class ShopComponent {}
