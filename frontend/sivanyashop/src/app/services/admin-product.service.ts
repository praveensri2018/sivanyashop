// FILE: src/app/services/admin-product.service.ts
// Place at: src/app/services/admin-product.service.ts
// This version uses ONLY your backend APIs (no cloudUploadUrl).
// Logs every response to console for debugging. Remove logs in production.

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap,map } from 'rxjs/operators';
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

  
  fetchProduct(productId: number | string): Observable<any> {
    // build url to match your backend route
    const url = `${this.base}/products/getdetails/${productId}`;

    return this.http.get(url).pipe(
      tap(res => console.log('[API] fetchProduct (getdetails) response:', res)),
      map((res: any) => {
        // Backend returns { product: { ... } } — normalize for frontend convenience
        const product = res?.product ?? res ?? null;

        // Defensive normalization: ensure CategoryIds is an array
        if (product) {
          product.CategoryIds = product.CategoryIds ?? product.categoryIds ?? [];
          product.images = product.images ?? product.Images ?? [];
          product.variants = product.variants ?? product.Variants ?? [];
        }

        return { product, raw: res };
      })
    );
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

  deleteProductImage(imageId: number) {
  // PLACE: ensure `this.base` contains your API base URL
  return this.http.delete(`${this.base}/product-images/${imageId}`);
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

  updateVariant(variantId: number, payload: any) {
    // PUT /api/products/variant/:id  (must match backend route)
    return this.http.put(`${this.base}/products/variant/${variantId}`, payload)
      .pipe(tap(res => console.log('[API] updateVariant response:', res)));
  }

    deleteVariant(variantId: number) {
    return this.http.delete(`${this.base}/products/variant/${variantId}`)
      .pipe(tap(res => console.log('[API] deleteVariant response:', res)));
  }

  // Soft-delete (if using deactivate route)
  deactivateVariant(variantId: number) {
    return this.http.put(`${this.base}/products/variant/${variantId}/deactivate`, {})
      .pipe(tap(res => console.log('[API] deactivateVariant response:', res)));
  }
}