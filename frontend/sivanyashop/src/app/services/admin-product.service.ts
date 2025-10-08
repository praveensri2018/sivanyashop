// FILE: src/app/services/admin-product.service.ts
// Place at: src/app/services/admin-product.service.ts
// This version uses ONLY your backend APIs (no cloudUploadUrl).
// Logs every response to console for debugging. Remove logs in production.

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AppConfig } from '../app.config';

export interface Product {
  id: number;
  name: string;
  description?: string;
  imagePath?: string;
  categoryIds?: number[];
}

@Injectable({ providedIn: 'root' })
export class AdminProductService {
  private base = `${AppConfig.apiBase}/api`;

  constructor(private http: HttpClient) {}

  /* -------------------------
     Products / categories
     ------------------------- */

  fetchProducts(page = 1, limit = 12): Observable<any> {
    const params = new HttpParams().set('page', String(page)).set('limit', String(limit));
    return this.http.get(`${this.base}/products`, { params })
      .pipe(tap(res => console.log('[API] fetchProducts response:', res)));
  }

  fetchProduct(productId: number | string): Observable<Product> {
    return this.http.get<Product>(`${this.base}/products/${productId}`)
      .pipe(tap(res => console.log('[API] fetchProduct response:', res)));
  }

  fetchCategories(): Observable<any> {
    return this.http.get(`${this.base}/products/categories`)
      .pipe(tap(res => console.log('[API] fetchCategories response:', res)));
  }

  createCategory(payload: { name: string; parentCategoryId?: number | null }) {
    return this.http.post(`${this.base}/products/category`, payload)
      .pipe(tap(res => console.log('[API] createCategory response:', res)));
  }

  createProduct(payload: any) {
    return this.http.post(`${this.base}/products/product`, payload)
      .pipe(tap(res => console.log('[API] createProduct response:', res)));
  }

  updateProduct(productId: number, payload: any) {
    return this.http.put(`${this.base}/products/product/${productId}`, payload)
      .pipe(tap(res => console.log('[API] updateProduct response for id', productId, ':', res)));
  }

  deleteProduct(productId: number) {
    return this.http.delete(`${this.base}/products/${productId}`)
      .pipe(tap(res => console.log('[API] deleteProduct response for id', productId, ':', res)));
  }

  /* -------------------------
     Variants & prices
     ------------------------- */

  addVariant(payload: any) {
    return this.http.post(`${this.base}/products/variant`, payload)
      .pipe(tap(res => console.log('[API] addVariant response:', res)));
  }

  setVariantPrice(variantId: number, priceType: string, price: number) {
    return this.http.post(`${this.base}/products/variant/price`, { variantId, priceType, price })
      .pipe(tap(res => console.log('[API] setVariantPrice response:', res)));
  }

  updateVariantPrice(variantId: number, priceType: string, price: number) {
    return this.http.put(`${this.base}/products/variant/price`, { variantId, priceType, price })
      .pipe(tap(res => console.log('[API] updateVariantPrice response:', res)));
  }

  /* -------------------------
     Image uploads (backend-only)
     ------------------------- */

  /**
   * Upload product images to backend.
   * Backend endpoint: POST /api/product-images/upload
   * FormData: productId, images[] (multiple)
   * Backend should return uploaded image info/URLs which will be logged.
   */
  uploadProductImages(productId: number, files: File[]): Observable<any> {
    const fd = new FormData();
    fd.append('productId', String(productId));
    files.forEach(f => fd.append('images', f, f.name));
    return this.http.post(`${this.base}/product-images/upload`, fd)
      .pipe(tap(res => console.log('[API] uploadProductImages response:', res)));
  }
}