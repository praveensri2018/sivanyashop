// src/app/services/cart.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, map, tap, switchMap } from 'rxjs/operators';
import { AppConfig } from '../app.config';
import { AuthService } from '../auth/auth.service';
import { forkJoin } from 'rxjs';

export interface CartItem {
  id?: number;        // cart item id when persisted on server
  cartId?: number;
  productId: number;
  variantId?: number | null;
  qty: number;
  price?: number | null; // unit price at time of add
  name?: string;
  image?: string;
  // optional metadata from server
  productName?: string;
  variantName?: string;
  sku?: string;
  attributes?: string;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private apiBase = AppConfig.apiBase.replace(/\/+$/, '');
  private itemsSubject = new BehaviorSubject<CartItem[]>([]);
  public items$ = this.itemsSubject.asObservable();

  // derived observables
  public total$ = this.items$.pipe(
    map(items =>
      items.reduce((acc, it) => acc + (Number(it.price || 0) * Number(it.qty || 0)), 0)
    )
  );

  public count$ = this.items$.pipe(
    map(items => items.reduce((acc, it) => acc + Number(it.qty || 0), 0))
  );

  private serverUrl = `${this.apiBase}/api/cart`;

  constructor(private http: HttpClient, private auth: AuthService) {
    // initialize: load server cart if logged in otherwise local cart
    this.loadInitial();
    // optionally refresh when auth changes (if AuthService exposes currentUser$)
    if ((this.auth as any).currentUser$ && typeof (this.auth as any).currentUser$.subscribe === 'function') {
      (this.auth as any).currentUser$.subscribe(() => this.loadInitial());
    }
  }

  // -------------------------
  // Public API expected by components
  // -------------------------
  add(item: { productId: number, variantId?: number | null, qty: number, price?: number | null }): Observable<any> {
    const headers = this.authHeaders();
    if (!headers) {
      // local fallback
      return of(this.addLocalItem(item)).pipe(map(() => ({ success: true, local: true })));
    }
    return this.http.post<any>(this.serverUrl, item, { headers }).pipe(
      tap(() => this.reloadFromServer().subscribe()),
      catchError(err => {
        console.error('Cart add failed', err);
        return throwError(() => err);
      })
    );
  }

  get(): Observable<{ success: boolean, items: CartItem[] }> {
    const headers = this.authHeaders();
    if (!headers) {
      const local = this.getLocalItems();
      // ensure subjects updated
      this.itemsSubject.next(local);
      return of({ success: true, items: local });
    }
    return this.http.get<any>(this.serverUrl, { headers }).pipe(
      map(res => {
        const items = this.normalizeServerItems(res?.items ?? res ?? []);
        this.itemsSubject.next(items);
        return { success: true, items };
      }),
      catchError(err => {
        console.error('Cart get failed', err);
        return throwError(() => err);
      })
    );
  }

  remove(cartItemId: number | string): Observable<any> {
    const headers = this.authHeaders();
    const id = typeof cartItemId === 'string' ? Number(cartItemId) : cartItemId;
    if (!headers) {
      const arr = this.getLocalItems().filter(i => i.id !== id);
      localStorage.setItem('local_cart', JSON.stringify(arr));
      this.itemsSubject.next(arr);
      return of({ success: true, local: true });
    }
    return this.http.delete<any>(`${this.serverUrl}/${id}`, { headers }).pipe(
      tap(() => this.reloadFromServer().subscribe()),
      catchError(err => {
        console.error('Cart remove failed', err);
        return throwError(() => err);
      })
    );
  }

  update(cartItemId: number, patch: Partial<CartItem>): Observable<any> {
  const headers = this.authHeaders();
  if (!headers) {
    // update local
    const arr = this.getLocalItems();
    const idx = arr.findIndex(i => i.id === cartItemId);
    if (idx >= 0) {
      arr[idx] = { ...arr[idx], ...patch };
      localStorage.setItem('local_cart', JSON.stringify(arr));
      this.itemsSubject.next(arr);
    }
    return of({ success: true, local: true, item: arr[idx] });
  }

  // Use PUT (backend has updateCartItemQty) — server expects { qty, price? }
  const body: any = {};
  if (typeof patch.qty !== 'undefined') body.qty = patch.qty;
  if (typeof patch.price !== 'undefined') body.price = patch.price;

  return this.http.put<any>(`${this.serverUrl}/${cartItemId}`, body, { headers }).pipe(
    tap(res => {
      // If server returns items+total, reload or normalize directly
      if (res && Array.isArray(res.items)) {
        const items = this.normalizeServerItems(res.items);
        this.itemsSubject.next(items);
      } else {
        // fallback: reload entire cart to ensure consistent state
        this.reloadFromServer().subscribe();
      }
    }),
    catchError(err => {
      console.error('Cart update failed', err);
      return throwError(() => err);
    })
  );
}

 clear(): Observable<any> {
  const headers = this.authHeaders();
  if (!headers) {
    localStorage.removeItem('local_cart');
    this.itemsSubject.next([]);
    return of({ success: true, local: true });
  }

  // fetch latest items (ensures we have correct ids)
  return this.get().pipe(
    switchMap(res => {
      const items = res.items || [];
      if (!items.length) return of({ success: true, items: [] });

      // build array of delete observables
      const deletes = items.map((it: any) => this.http.delete(`${this.serverUrl}/${it.id}`, { headers }).pipe(
        catchError(err => {
          console.warn('single item delete failed', it.id, err);
          return of(null);
        })
      ));

      // run them in parallel
      return forkJoin(deletes).pipe(
        tap(() => {
          // reload final state from server
          this.reloadFromServer().subscribe();
        })
      );
    }),
    catchError(err => {
      console.warn('Cart clear failed', err);
      return throwError(() => err);
    })
  );
}

  // -------------------------
  // Internal helpers
  // -------------------------
  private authHeaders(): HttpHeaders | null {
    const token = this.auth.getToken();
    if (!token) return null;
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  private loadInitial() {
    const headers = this.authHeaders();
    if (!headers) {
      const local = this.getLocalItems();
      this.itemsSubject.next(local);
      return;
    }
    // fetch server cart
    this.reloadFromServer().subscribe();
  }

  private reloadFromServer(): Observable<any> {
    const headers = this.authHeaders();
    if (!headers) return of(null);
    return this.http.get<any>(this.serverUrl, { headers }).pipe(
      tap(res => {
        const items = this.normalizeServerItems(res?.items ?? res ?? []);
        this.itemsSubject.next(items);
      }),
      catchError(err => {
        console.error('reload cart fail', err);
        return of(null);
      })
    );
  }

  private normalizeServerItems(items: any[]): CartItem[] {
    if (!Array.isArray(items)) return [];
    return items.map(it => {
      // backend shape: CartItemId, CartId, ProductId, VariantId, Qty, Price, ProductName, ImagePath, VariantName, SKU, Attributes
      return {
        id: it.CartItemId ?? it.Id ?? it.id,
        cartId: it.CartId ?? it.cartId,
        productId: Number(it.ProductId ?? it.productId ?? it.productId),
        variantId: (it.VariantId ?? it.variantId ?? it.variantId) != null ? Number(it.VariantId ?? it.variantId ?? it.variantId) : null,
        qty: Number(it.Qty ?? it.qty ?? it.Qty ?? 0),
        price: (it.Price ?? it.price) != null ? Number(it.Price ?? it.price) : null,
        productName: it.ProductName ?? it.productName ?? it.name,
        image: it.ImagePath ?? it.image ?? it.ImageUrl ?? null,
        variantName: it.VariantName ?? it.variantName ?? null,
        sku: it.SKU ?? it.sku ?? null,
        attributes: it.Attributes ?? it.attributes ?? null
      } as CartItem;
    });
  }

  // ---------- local cart helpers ----------
  private getLocalItems(): CartItem[] {
    try {
      const raw = localStorage.getItem('local_cart');
      const arr = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(arr)) return [];
      return arr;
    } catch (e) {
      console.warn('local cart read failed', e);
      return [];
    }
  }

  private addLocalItem(payload: { productId: number, variantId?: number | null, qty: number, price?: number | null }): CartItem {
    const arr = this.getLocalItems();
    // try merge by product+variant
    const found = arr.find(i => i.productId === payload.productId && (i.variantId ?? null) === (payload.variantId ?? null));
    if (found) {
      found.qty = Number(found.qty || 0) + Number(payload.qty || 0);
      if (payload.price != null) found.price = payload.price;
    } else {
      const newItem: CartItem = {
        id: Date.now(), // temporary id for local usage
        productId: payload.productId,
        variantId: payload.variantId ?? null,
        qty: Number(payload.qty || 1),
        price: payload.price ?? null,
        createdAt: (new Date()).toISOString() as any
      } as any;
      arr.push(newItem);
    }
    localStorage.setItem('local_cart', JSON.stringify(arr));
    this.itemsSubject.next(arr);
    return found ?? arr[arr.length - 1];
  }
}
