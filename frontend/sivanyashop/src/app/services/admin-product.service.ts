// FILE: src/app/services/admin-product.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap, map } from 'rxjs/operators';
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

  // ✅ UPDATED: Enhanced stock update with movement type
  updateVariantStock(variantId: number, stockQty: number, movementType: string = 'MANUAL_ADJUST'): Observable<any> {
    const payload = { variantId, stockQty, movementType };
    return this.http.put(`${this.base}/products/variant/${variantId}/stock`, payload)
      .pipe(tap(res => console.log('[API] updateVariantStock response:', res)));
  }

  // ✅ UPDATED: Enhanced bulk update with movement type
  bulkUpdateStock(stockUpdates: Array<{variantId: number, stockQty: number, movementType?: string}>): Observable<any> {
    const updates = stockUpdates.map(update => ({
      ...update,
      movementType: update.movementType || 'BULK_UPDATE'
    }));
    return this.http.post(`${this.base}/products/bulk-stock-update`, { updates })
      .pipe(tap(res => console.log('[API] bulkUpdateStock response:', res)));
  }
  
  fetchProduct(productId: number | string): Observable<any> {
    const url = `${this.base}/products/getdetails/${productId}`;
    return this.http.get(url).pipe(
      tap(res => console.log('[API] fetchProduct (getdetails) response:', res)),
      map((res: any) => {
        const product = res?.product ?? res ?? null;
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

  updateCategory(categoryId: number, payload: { name: string; parentCategoryId?: number | null }) {
    return this.http.put(`${this.base}/products/category/${categoryId}`, payload)
      .pipe(tap(res => console.log('[API] updateCategory response:', res)));
  }

  deleteCategory(categoryId: number) {
    return this.http.delete(`${this.base}/products/category/${categoryId}`)
      .pipe(tap(res => console.log('[API] deleteCategory response:', res)));
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
     Image uploads
     ------------------------- */

  uploadProductImages(productId: number, files: File[]): Observable<any> {
    const fd = new FormData();
    fd.append('productId', String(productId));
    files.forEach(f => fd.append('images', f, f.name));
    return this.http.post(`${this.base}/product-images/upload`, fd)
      .pipe(tap(res => console.log('[API] uploadProductImages response:', res)));
  }

  updateVariant(variantId: number, payload: any) {
    return this.http.put(`${this.base}/products/variant/${variantId}`, payload)
      .pipe(tap(res => console.log('[API] updateVariant response:', res)));
  }

  deleteVariant(variantId: number) {
    return this.http.delete(`${this.base}/products/variant/${variantId}`)
      .pipe(tap(res => console.log('[API] deleteVariant response:', res)));
  }

  deactivateVariant(variantId: number) {
    return this.http.put(`${this.base}/products/variant/${variantId}/deactivate`, {})
      .pipe(tap(res => console.log('[API] deactivateVariant response:', res)));
  }

  // ✅ NEW METHOD: Get stock ledger for reporting
  getStockLedger(productId?: number): Observable<any> {
    let url = `${this.base}/stock/ledger`;
    if (productId) {
      url = `${this.base}/stock/${productId}`;
    }
    return this.http.get(url)
      .pipe(tap(res => console.log('[API] getStockLedger response:', res)));
  }
}