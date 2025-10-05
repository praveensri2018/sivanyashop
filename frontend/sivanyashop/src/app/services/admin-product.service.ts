// Place file at: src/app/services/admin-product.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfig } from '../app.config';

export interface Product {
  id: number;
  name: string;
  description?: string;
  imagePath?: string;
  categoryIds?: number[];
  // add more fields as your backend returns
}

@Injectable({ providedIn: 'root' })
export class AdminProductService {
  private base = `${AppConfig.apiBase}/api`;

  constructor(private http: HttpClient) {}

  // Fetch products paginated
  fetchProducts(page = 1, limit = 12): Observable<{ items: Product[]; total?: number }> {
    const params = new HttpParams().set('page', String(page)).set('limit', String(limit));
    return this.http.get<{ items: Product[]; total?: number }>(`${this.base}/products`, { params });
  }

  // Fetch a single product by id (assumes endpoint exists; if not, adapt)
  fetchProduct(productId: number | string): Observable<Product> {
    return this.http.get<Product>(`${this.base}/products/${productId}`);
  }

  // create / update / delete etc. (already shown earlier) - include only what's needed for shop
  // For completeness, quick wrappers:
  fetchCategories(): Observable<any> {
    return this.http.get(`${this.base}/products/categories`);
  }
}
