// Place file at: src/app/cart/cart.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { CartService } from '../services/cart.service'; // Place: ensure this path is correct

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss']
})
export class CartComponent implements OnInit {
  // Place: src/app/cart/cart.component.ts
  // Observables exposed to template (HTML already provided by you)
  items$!: Observable<any[]>;   // stream of cart items (normalized by CartService)
  total$!: Observable<number>;  // stream of running total (CartService provides)
  loading = false;             // simple UI flag used to disable actions if needed

  constructor(private cart: CartService) {}

  ngOnInit(): void {
    // wire observables from CartService
    this.items$ = this.cart.items$;
    this.total$ = this.cart.total$;

    // ensure fresh data on init
    // CartService.reloadFromServer is internal; use cart.get() which refreshes and updates subject
    this.cart.get().subscribe({
      next: () => {},
      error: (err) => {
        console.error('Failed to load cart on init', err);
      }
    });
  }

  // Place: src/app/cart/cart.component.ts
  // Remove item from cart (calls backend when authenticated, falls back to local when not)
  removeItem(itemId: number | string) {
    if (itemId == null) return;
    this.loading = true;
    this.cart.remove(Number(itemId)).pipe(
      finalize(() => this.loading = false)
    ).subscribe({
      next: (res) => {
        // server or local remove succeeded; CartService updates the subject
        if (res && res.success === false) {
          console.error('Remove failed', res);
          alert('Failed to remove item.');
        }
      },
      error: (err) => {
        console.error('Remove error', err);
        alert('Failed to remove item (network).');
      }
    });
  }

  // Place: src/app/cart/cart.component.ts
  // Update quantity for an item. If new quantity <= 0, remove the item.
  updateQty(item: any, delta: number) {
    // item shape expected: { id, qty, price, ... } as normalized by CartService
    const currentQty = Number(item?.qty ?? item?.Qty ?? 1);
    const newQty = currentQty + delta;

    // If going to zero or negative, remove the item instead of updating qty
    if (newQty <= 0) {
      // call removeItem using the normalized 'id' field
      const idToRemove = item?.id ?? item?.CartItemId ?? item?.CartItemId;
      this.removeItem(idToRemove);
      return;
    }

    // Prepare patch payload (server expects { qty, price? })
    const id = item?.id ?? item?.CartItemId;
    if (id == null) {
      console.warn('updateQty: item has no id, skipping', item);
      return;
    }

    this.loading = true;
    this.cart.update(Number(id), { qty: newQty }).pipe(
      finalize(() => this.loading = false)
    ).subscribe({
      next: (res) => {
        if (res && res.success === false) {
          console.error('Update failed', res);
          alert('Failed to update item quantity.');
        }
        // on success CartService will have updated the BehaviorSubject
      },
      error: (err) => {
        console.error('Update qty error', err);
        alert('Failed to update quantity (network).');
      }
    });
  }

  // Place: src/app/cart/cart.component.ts
  // Clear cart (client-side). If you implement server-side clear endpoint,
  // update CartService.clear() to call it and then use this.cart.clear().
  clearCart() {
    if (!confirm('Clear cart? This will remove all items from your cart.')) return;
    this.loading = true;
    this.cart.clear().pipe(
      finalize(() => this.loading = false)
    ).subscribe({
      next: (res) => {
        if (res && res.success === false) {
          console.error('Clear failed', res);
          alert('Failed to clear cart.');
        }
      },
      error: (err) => {
        console.error('Clear error', err);
        alert('Failed to clear cart (network).');
      }
    });
  }

  // Place: src/app/cart/cart.component.ts
  // Checkout placeholder — navigate to checkout route or open modal as required
  checkout() {
    // Replace with actual navigation to checkout page in your app:
    // this.router.navigate(['/checkout']);
    console.log('Proceed to checkout');
  }
}
