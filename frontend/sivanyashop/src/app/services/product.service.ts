import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfig } from '../app.config';
import { AuthService } from '../auth/auth.service';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private apiBase = AppConfig.apiBase.replace(/\/+$/, '');

  constructor(private http: HttpClient, private auth: AuthService) {}

  /**
   * Fetch products with pagination and optional search.
   * Expects backend query params: ?page=1&limit=24&q=...
   * Backends commonly return: { products: [...], total: N, page, limit } or { data: [...], total } or array.
   */
  fetchProducts(page = 1, limit = 24, q?: string): Observable<{ items:any[], total:number, page:number, limit:number }> {
  // choose endpoint based on presence of token
  const token = this.auth.getToken();
  const base = this.apiBase.replace(/\/+$/, '');
  const endpoint = token ? `${base}/api/products/user` : `${base}/api/products/public`;

  let params = new HttpParams().set('page', String(page)).set('limit', String(limit));
  if (q) params = params.set('q', String(q));

  const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;

  return this.http.get<any>(endpoint, { params, headers }).pipe(
    map((res: any) => {
      const items = res?.items ?? res?.products ?? res?.data ?? (Array.isArray(res) ? res : []);
      const total = Number(res?.total ?? res?.count ?? res?.totalItems ?? (Array.isArray(items) ? items.length : 0));
      const respPage = Number(res?.page ?? page);
      const respLimit = Number(res?.limit ?? limit);
      return { items: Array.isArray(items) ? items : [], total: Number.isNaN(total) ? 0 : total, page: respPage, limit: respLimit };
    })
  );
}


  fetchProductById(productId: number | string): Observable<{ product: any } | null> {
    const token = this.auth.getToken();
    const endpoint = token ? `${this.apiBase}/api/products/user/${productId}` : `${this.apiBase}/api/products/public/${productId}`;
    const options: any = {};
    if (token) options.headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    return this.http.get<any>(endpoint, options).pipe(
      map((res: any) => {
        // backend may return { success: true, product: {...} } or just {...}
        if (!res) return null;
        const product = res?.product ?? res?.data ?? res;
        return { product };
      })
    );
  }

}
