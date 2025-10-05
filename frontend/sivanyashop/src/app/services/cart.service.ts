// Place file at: src/app/services/cart.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface CartItem {
  id: number | string;
  name: string;
  price: number;
  qty: number;
  image?: string;
  variant?: string;
  [key: string]: any;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private storageKey = 'cart_items_v1';

  private itemsSubject = new BehaviorSubject<CartItem[]>(this.loadFromStorage());
  public items$ = this.itemsSubject.asObservable();

  // total as observable (sum of price * qty)
  public total$: Observable<number> = this.items$.pipe(
    map(items => items.reduce((acc, it) => acc + (Number(it.price) || 0) * (Number(it.qty) || 0), 0))
  );

  // count observable convenience
  public count$ = this.items$.pipe(map(items => items.reduce((s, i) => s + (i.qty || 0), 0)));

  private loadFromStorage(): CartItem[] {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return [];
      return JSON.parse(raw) as CartItem[];
    } catch {
      return [];
    }
  }

  private saveToStorage(items: CartItem[]) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(items));
    } catch { /* ignore */ }
  }

  // public API

  /** Get current items snapshot (non-reactive) */
  getSnapshot(): CartItem[] {
    return [...this.itemsSubject.value];
  }

  /** Add an item (if exists, increments qty) */
  add(item: CartItem) {
    const items = this.getSnapshot();
    const idx = items.findIndex(i => String(i.id) === String(item.id));
    if (idx > -1) {
      items[idx].qty = (items[idx].qty || 0) + (item.qty || 1);
    } else {
      items.push({ ...item, qty: item.qty ?? 1 });
    }
    this.itemsSubject.next(items);
    this.saveToStorage(items);
  }

  /** Remove item by id */
  remove(id: number | string) {
    const items = this.getSnapshot().filter(i => String(i.id) !== String(id));
    this.itemsSubject.next(items);
    this.saveToStorage(items);
  }

  /** Update item by id with partial changes (e.g., { qty: 3 }) */
  update(id: number | string, changes: Partial<CartItem>) {
    const items = this.getSnapshot();
    const idx = items.findIndex(i => String(i.id) === String(id));
    if (idx === -1) return;
    items[idx] = { ...items[idx], ...changes };
    // if qty becomes 0 or less, remove the item
    if ((items[idx].qty ?? 0) <= 0) {
      items.splice(idx, 1);
    }
    this.itemsSubject.next(items);
    this.saveToStorage(items);
  }

  /** Clear cart */
  clear() {
    this.itemsSubject.next([]);
    try { localStorage.removeItem(this.storageKey); } catch {}
  }
}
