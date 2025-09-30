// src/app/services/cart.service.ts
// Place file at: src/app/services/cart.service.ts

import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Product } from '../models/product';

export interface CartItem { product: Product; qty: number; }

@Injectable({ providedIn: 'root' })
export class CartService {
  private items: CartItem[] = [];
  private items$ = new BehaviorSubject<CartItem[]>([]);
  private count$subj = new BehaviorSubject<number>(0);

  readonly itemsObservable = this.items$.asObservable();
  readonly count$ = this.count$subj.asObservable();

  add(product: Product, qty = 1) {
    const item = this.items.find(i => i.product.id === product.id);
    if (item) item.qty += qty;
    else this.items.push({ product, qty });
    this.emit();
  }

  remove(productId: string) {
    this.items = this.items.filter(i => i.product.id !== productId);
    this.emit();
  }

  updateQty(productId: string, qty: number) {
    const item = this.items.find(i => i.product.id === productId);
    if (!item) return;
    item.qty = qty;
    if (item.qty <= 0) this.remove(productId);
    else this.emit();
  }

  clear() { this.items = []; this.emit(); }

  getItems() { return [...this.items]; }

  private emit() {
    this.items$.next(this.getItems());
    const count = this.items.reduce((s, it) => s + it.qty, 0);
    this.count$subj.next(count);
  }
}
