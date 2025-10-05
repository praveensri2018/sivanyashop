// Place file at: src/app/shop/shop.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminProductService, Product } from '../services/admin-product.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-shop',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './shop.component.html',
  styleUrls: ['./shop.component.scss']
})
export class ShopComponent implements OnInit {
  products: Product[] = [];
  loading = false;
  page = 1;
  limit = 12;
  total = 0;

  constructor(private svc: AdminProductService) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(page = 1) {
    this.loading = true;
    this.svc.fetchProducts(page, this.limit).subscribe({
      next: (res) => {
        // support API that returns items or array directly
        if ((res as any).items) {
          this.products = (res as any).items;
          this.total = (res as any).total ?? this.products.length;
        } else {
          // some APIs return array directly
          this.products = res as unknown as Product[];
          this.total = this.products.length;
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load products', err);
        this.loading = false;
      }
    });
  }
}
