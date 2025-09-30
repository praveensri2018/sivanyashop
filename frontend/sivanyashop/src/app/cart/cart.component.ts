// src/app/cart/cart.component.ts
// Place this at: src/app/cart/cart.component.ts
// Shows cart items and allows update/remove.

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService, CartItem } from '../services/cart.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <section>
      <h2 class="text-xl font-bold mb-4">Your Cart</h2>

      <div *ngIf="items.length; else empty" class="space-y-4">
        <div *ngFor="let it of items" class="flex items-center gap-4 border rounded p-3">
          <div class="w-20 h-20 bg-gray-50 flex items-center justify-center text-3xl">👜</div>
          <div class="flex-1">
            <div class="font-semibold">{{ it.product.title }}</div>
            <div class="text-sm text-gray-600">₹{{ it.product.price }}</div>
          </div>

          <div class="flex items-center gap-2">
            <button (click)="changeQty(it.product.id, it.qty - 1)" class="px-2">-</button>
            <div>{{ it.qty }}</div>
            <button (click)="changeQty(it.product.id, it.qty + 1)" class="px-2">+</button>
          </div>

          <div>
            <button (click)="remove(it.product.id)" class="text-red-600">Remove</button>
          </div>
        </div>

        <div class="text-right mt-4">
          <div class="text-lg font-bold">Total: ₹{{ total }}</div>
          <button class="mt-2 px-4 py-2 bg-green-600 text-white rounded">Checkout (static)</button>
        </div>
      </div>

      <ng-template #empty>
        <div class="text-gray-600">Your cart is empty. <a routerLink="/">Shop now</a></div>
      </ng-template>
    </section>
  `
})
export class CartComponent {
  items: CartItem[] = [];
  total = 0;

  constructor(private cart: CartService) {
    this.items = this.cart.getItems();
    this.computeTotal();
    this.cart.itemsObservable.subscribe(() => {
      this.items = this.cart.getItems();
      this.computeTotal();
    });
  }

  changeQty(id: string, qty: number) {
    this.cart.updateQty(id, qty);
  }

  remove(id: string) {
    this.cart.remove(id);
  }

  private computeTotal() {
    this.total = this.items.reduce((s, it) => s + it.product.price * it.qty, 0);
  }
}
