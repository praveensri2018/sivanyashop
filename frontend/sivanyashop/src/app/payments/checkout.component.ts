// Place file at: src/app/payments/checkout.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaymentService } from '../services/payment.service';
import { CartService } from '../services/cart.service'; // optional: to get total or clear cart after payment
import { finalize } from 'rxjs/operators';

declare const Razorpay: any; // checkout script exposes global Razorpay

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="checkout-box">
      <button class="btn btn-primary" [disabled]="loading" (click)="startCheckout()">
        {{ loading ? 'Processing...' : 'Pay Now' }}
      </button>
      <div *ngIf="error" class="text-danger small mt-2">{{ error }}</div>
    </div>
  `
})
export class CheckoutComponent {
  loading = false;
  error: string | null = null;

  // Optionally set key here if you keep it in front (Razorpay key id is public)
  // If you prefer, fetch key_id from backend when creating order.
  private razorpayKeyId = (window as any).__RAZORPAY_KEY_ID || ''; // optional global override

  constructor(private paymentSvc: PaymentService, private cartSvc: CartService) {}

  // entry point for checkout (you might pass amount or cartId instead)
  startCheckout() {
    this.error = null;
    this.loading = true;

    // You can compute amount from CartService.total$ or pass an explicit amount.
    // Here we'll compute total by taking current items from cart's BehaviorSubject
    const items = (this.cartSvc as any).itemsSubject?.getValue?.() ?? [];
    const total = items.reduce((s: number, it: any) => s + (Number(it.price || 0) * Number(it.qty || 1)), 0);
    const amountInRupees = Number(total || 0);

    if (amountInRupees <= 0) {
      this.error = 'Cart is empty or invalid amount.';
      this.loading = false;
      return;
    }

    // Create order on backend (expects rupees)
    this.paymentSvc.createOrder(amountInRupees, { notes: { purpose: 'Cart payment' } }).pipe(
      finalize(() => { /* cleanup handled in subscribe */ })
    ).subscribe({
      next: (res) => {
        try {
          const order = res.order;
          if (!order || !order.id) {
            this.error = 'Failed to create payment order.';
            this.loading = false;
            return;
          }

          // Prepare checkout options
          const options: any = {
            key: this.razorpayKeyId || (window as any).__RAZORPAY_KEY_ID || (window as any).RAZORPAY_KEY_ID || (window as any).RAZORPAY_KEY,
            amount: order.amount, // in paise
            currency: order.currency || 'INR',
            name: 'Your Shop Name',
            description: 'Purchase from SivanyaShop',
            order_id: order.id,
            handler: (response: any) => {
              // response: { razorpay_payment_id, razorpay_order_id, razorpay_signature }
              this.onPaymentSuccess(response, order);
            },
            prefill: {
              name: '', // optionally fill from user profile
              email: '',
              contact: ''
            },
            theme: {
              color: '#0b5cff'
            }
          };

          // Ensure key exists - if not, the backend could respond with key_id or put in window var
          if (!options.key) {
            console.warn('Razorpay key id missing on frontend. Make sure __RAZORPAY_KEY_ID is set or options.key is provided.');
            // Continue anyway - Razorpay will fail without key.
          }

          // Open checkout
          const rzp = new Razorpay(options);
          rzp.on('payment.failed', (err: any) => {
            console.error('Razorpay payment failed', err);
            this.error = err?.error?.description || 'Payment failed';
            this.loading = false;
          });

          rzp.open();
          // do not set loading false here — will be cleared in handler or on failure
        } catch (err) {
          console.error('Error launching Razorpay', err);
          this.error = 'Payment initialization failed';
          this.loading = false;
        }
      },
      error: (err) => {
        console.error('createOrder error', err);
        this.error = 'Failed to create payment order';
        this.loading = false;
      }
    });
  }

  private onPaymentSuccess(response: any, razorpayOrder: any) {
    // call backend verify endpoint to validate signature and mark order paid
    const payload = {
      razorpay_order_id: response.razorpay_order_id,
      razorpay_payment_id: response.razorpay_payment_id,
      razorpay_signature: response.razorpay_signature,
      // optionally include your own order/cart id
      // orderId: yourInternalOrderId
    };

    this.paymentSvc.verifyPayment(payload).pipe(
      finalize(() => {
        this.loading = false;
      })
    ).subscribe({
      next: (res) => {
        if (res && res.success) {
          // Payment verified & accepted by server
          // TODO: show success page, clear cart, navigate to order confirmation
          alert('Payment successful — order confirmed!');
          // Example: clear cart client-side then reload
          this.cartSvc.clearLocal(); // or call server clear if implemented
        } else {
          console.warn('verifyPayment returned failure', res);
          this.error = res?.message || 'Payment verification failed';
        }
      },
      error: (err) => {
        console.error('verifyPayment error', err);
        this.error = 'Payment verification failed (network)';
      }
    });
  }
}
