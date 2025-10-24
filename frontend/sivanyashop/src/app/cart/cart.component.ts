// Place file at: src/app/cart/cart.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { CartService } from '../services/cart.service'; // ensure path correct
import { PaymentService } from '../services/payment.service'; // ensure you added this service
import { take } from 'rxjs/operators';

declare const Razorpay: any; // razorpay checkout script exposes global

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss']
})
export class CartComponent implements OnInit {
  items$!: Observable<any[]>;   // stream of cart items (normalized by CartService)
  total$!: Observable<number>;  // stream of running total (CartService provides)
  loading = false;             // simple UI flag used to disable actions if needed
  error: string | null = null;

  constructor(
    private cart: CartService,
    private paymentSvc: PaymentService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // wire observables from CartService
    this.items$ = this.cart.items$;
    this.total$ = this.cart.total$;

    // ensure fresh data on init
    this.cart.get().subscribe({
      next: () => {},
      error: (err) => {
        console.error('Failed to load cart on init', err);
      }
    });
  }

  removeItem(itemId: number | string) {
    if (itemId == null) return;
    this.loading = true;
    this.cart.remove(Number(itemId)).pipe(
      finalize(() => this.loading = false)
    ).subscribe({
      next: (res) => {
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

  updateQty(item: any, delta: number) {
    const currentQty = Number(item?.qty ?? item?.Qty ?? 1);
    const newQty = currentQty + delta;

    if (newQty <= 0) {
      const idToRemove = item?.id ?? item?.CartItemId;
      this.removeItem(idToRemove);
      return;
    }

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
      },
      error: (err) => {
        console.error('Update qty error', err);
        alert('Failed to update quantity (network).');
      }
    });
  }

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

  // ---------- NEW: Checkout flow that opens Razorpay ----------
  // Click Checkout -> create order on server -> open Razorpay -> verify -> finalize
  checkout() {
    this.error = null;
    this.loading = true;

    // Get current cart items snapshot (CartService exposes items$ not a direct getter).
    // If CartService exposes itemsSubject you can read directly; otherwise take 1 from observable.
    let amountInRupees = 0;
    // get latest total once
    this.total$.pipe(take(1)).subscribe(total => amountInRupees = Number(total || 0));

    if (!amountInRupees || amountInRupees <= 0) {
      this.loading = false;
      this.error = 'Cart is empty or invalid amount.';
      return;
    }

    // create Razorpay order on backend (amount in rupees)
this.paymentSvc.createOrder(amountInRupees, { notes: { purpose: 'Cart payment' } }).pipe(
      finalize(() => {
        // do not prematurely clear loading — loading will be cleared in handlers
      })
    ).subscribe({
      next: (res) => {
        if (!res || !res.order || !res.order.id) {
          this.loading = false;
          this.error = 'Failed to initialize payment.';
          return;
        }

        const order = res.order; // contains id, amount (in paise), currency
        // Prepare checkout options
        const options: any = {
          key: (window as any).__RAZORPAY_KEY_ID || (res.order.key_id || (window as any).RAZORPAY_KEY_ID) || '', // try multiple places
          amount: order.amount, // amount in paise returned by server
          currency: order.currency || 'INR',
          name: 'Your Shop',
          description: 'Order Payment',
          order_id: order.id,
          handler: (response: any) => {
            // On successful payment, verify server-side
            this.verifyPayment(response);
          },
          prefill: {
            name: '', email: '', contact: ''
          },
          theme: { color: '#0b5cff' }
        };

        try {
          const rzp = new Razorpay(options);
          rzp.on('payment.failed', (err: any) => {
            console.error('Razorpay payment failed', err);
            this.loading = false;
            this.error = err?.error?.description || 'Payment failed';
          });
          rzp.open();
          // Keep loading true until we either verify or failure occurs
        } catch (err) {
          console.error('Error opening Razorpay', err);
          this.loading = false;
          this.error = 'Failed to open payment gateway.';
        }
      },
      error: (err) => {
        console.error('createOrder error', err);
        this.loading = false;
        this.error = 'Failed to create payment order.';
      }
    });
  }

  private verifyPayment(response: any) {
    // response contains razorpay_order_id, razorpay_payment_id, razorpay_signature
    const payload = {
      razorpay_order_id: response.razorpay_order_id,
      razorpay_payment_id: response.razorpay_payment_id,
      razorpay_signature: response.razorpay_signature
    };

    this.paymentSvc.verifyPayment(payload).pipe(
      finalize(() => {
        // finalize handler will executed after verify observable completes
      })
    ).subscribe({
      next: (res) => {
        this.loading = false;
        if (res && res.success) {
          // Payment verified. Clear cart and navigate to confirmation.
          // Use server-side clear if CartService.clear() implements it; otherwise it will remove items one-by-one.
          this.cart.clear().subscribe({
            next: () => {
              // navigate to order confirmation page (create this route/page)
              this.router.navigate(['/order-confirmation']);
            },
            error: (err) => {
              console.warn('Cart clear after payment failed', err);
              // still navigate to confirmation but warn user
              this.router.navigate(['/order-confirmation']);
            }
          });
        } else {
          console.warn('verifyPayment returned failure', res);
          this.error = res?.message || 'Payment verification failed';
        }
      },
      error: (err) => {
        console.error('verifyPayment error', err);
        this.loading = false;
        this.error = 'Payment verification failed (network)';
      }
    });
  }
}
