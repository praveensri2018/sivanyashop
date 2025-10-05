// Place file at: src/app/shop/product-detail.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { AdminProductService, Product } from '../services/admin-product.service';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.scss']
})
export class ProductDetailComponent implements OnInit {
  product: Product | null = null;
  loading = false;

  constructor(private route: ActivatedRoute, private svc: AdminProductService) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.loadProduct(id);
  }

  loadProduct(id: string) {
    this.loading = true;
    this.svc.fetchProduct(id).subscribe({
      next: (p) => { this.product = p; this.loading = false; },
      error: (err) => { console.error('fetch product failed', err); this.loading = false; }
    });
  }
}