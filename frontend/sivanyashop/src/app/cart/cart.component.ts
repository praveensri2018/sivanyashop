import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { take } from 'rxjs/operators';
import { CartService } from '../services/cart.service'; 
import { PaymentService } from '../services/payment.service'; 
import { ShippingAddressComponent } from '../checkout/shipping-address.component';
import { ActivatedRoute } from '@angular/router'; 

declare var Razorpay: any;

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule,ShippingAddressComponent],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss']
})

export class CartComponent implements OnInit {
  items$!: Observable<any[]>;   
  total$!: Observable<number>;  
  loading = false;             
  error: string | null = null;
    showTestButton = false; 

  selectedShippingAddressId: number | null = null;

  constructor(
    private cart: CartService,
    private paymentSvc: PaymentService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.items$ = this.cart.items$;
    this.total$ = this.cart.total$;
    this.cart.get().subscribe({
      next: () => {},
      error: (err) => {
        console.error('Failed to load cart on init', err);
      }
    });
        this.setupTestButtonVisibility();

  }

  
  private setupTestButtonVisibility() {
    // 1) Hostname check (localhost/127.0.0.1)
    const host = window?.location?.hostname || '';
    if (host === 'localhost' || host === '127.0.0.1') {
      this.showTestButton = true;
      // TELL_EVERY_TIME: showTestButton enabled because running on localhost
      return;
    }

    // 2) Query param override (e.g. ?test=true or ?showTest=1)
    // Read query params once (ngOnInit), or subscribe if you need live updates.
    const qpTest = this.route.snapshot.queryParamMap.get('test') || this.route.snapshot.queryParamMap.get('showTest');
    if (qpTest) {
      const val = qpTest.toLowerCase();
      if (val === '1' || val === 'true' || val === 'yes') {
        this.showTestButton = true;
        // TELL_EVERY_TIME: showTestButton enabled via URL param
        return;
      }
    }

    // 3) Optional global flag override (example: window.__SHOW_TEST === true)
    if ((window as any).__SHOW_TEST === true) {
      this.showTestButton = true;
      // TELL_EVERY_TIME: showTestButton enabled via global flag
      return;
    }

    // default: hide
    this.showTestButton = false;
    // TELL_EVERY_TIME: showTestButton disabled by default (production)
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

checkout() {
  if (!this.selectedShippingAddressId) {
    alert('Please select a shipping address');
    return;
  }

  this.error = null;
  this.loading = true;

  let cartItems: any[] = [];
  let amountInRupees = 0;

  this.items$.pipe(take(1)).subscribe(items => { cartItems = items; });
  this.total$.pipe(take(1)).subscribe(total => { amountInRupees = Number(total || 0); });

  if (!amountInRupees || amountInRupees <= 0) {
    this.loading = false;
    this.error = 'Cart is empty or invalid amount.';
    return;
  }

  // create order on server
  this.paymentSvc.createOrder(amountInRupees, {
    notes: { purpose: 'Cart payment', items_count: cartItems.length }
  }).pipe(finalize(() => {
    // don't set loading false here — we wait for handlers (payment success/fail/dismiss)
    // finalize left intentionally minimal
  })).subscribe({
    next: (res) => {
      if (!res || !res.order || !res.order.id) {
        this.loading = false;
        this.error = 'Failed to initialize payment.';
        return;
      }

      const order = res.order;
      const options: any = {
        key: (window as any).__RAZORPAY_KEY_ID || (res.order.key_id || (window as any).RAZORPAY_KEY_ID) || '',
        amount: order.amount,
        currency: order.currency || 'INR',
        name: 'Sivanuya Trends Tops',
        description: 'Order Payment',
        order_id: order.id,
        handler: (response: any) => {
          // Payment succeeded -> verify on backend
          // ensure we clear loading in verifyPayment's finalize
          this.verifyPayment(response, cartItems);
        },
        prefill: { name: '', email: '', contact: '' },
        theme: { color: '#0b5cff' }
      };

      let rzp: any;
      try {
        rzp = new Razorpay(options);

        // payment failed handler
        rzp.on('payment.failed', (err: any) => {
          console.error('Razorpay payment failed', err);
          // set loading false and show error
          this.loading = false;
          this.error = err?.error?.description || 'Payment failed';
          alert('Payment failed: ' + (err?.error?.description || 'Unknown error'));
        });

        // checkout dismissed / closed handler (user clicked cancel / closed modal)
        // Some versions use 'checkout.dismiss' event name — add both to be safe
        if (typeof rzp.on === 'function') {
          try {
            rzp.on('checkout.dismiss', () => {
              console.log('Razorpay checkout dismissed by user');
              this.loading = false; // IMPORTANT: return to normal state
            });
          } catch (e) {
            // ignore if event not supported
          }
        }

        // older/newer SDKs sometimes emit 'modal.closed' or similar; also attach a fallback using window event
        // fallback: when open() returns, we set a timeout to ensure UI recovers if neither handler fired
        const fallbackTimeout = window.setTimeout(() => {
          // If still loading after 2 minutes (unlikely), reset UI to avoid stuck state
          if (this.loading) {
            console.warn('Razorpay fallback timeout resetting loading state');
            this.loading = false;
          }
        }, 2 * 60 * 1000); // 2 minutes

        // Open the checkout
        rzp.open();

        // Clean-up: when verifyPayment completes it will clear loading. But also ensure that when page unloads or route changes, we clear fallback
        const clearFallback = () => {
          window.clearTimeout(fallbackTimeout);
        };
        // call once now (we'll keep it to ensure safety)
        clearFallback();

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


  onAddressSelected(addressId: number) {
  this.selectedShippingAddressId = addressId;
}


  // TEST METHOD - Add this to your component
  testOrderCreation() {
    console.log('🧪 Testing order creation without payment...');
    
    // Get current cart items
    let cartItems: any[] = [];
    this.items$.pipe(take(1)).subscribe(items => {
      cartItems = items;
    });

    if (cartItems.length === 0) {
      alert('Cart is empty. Add some items first.');
      return;
    }

    this.loading = true;

    // Create test payment data (simulate Razorpay response)
    const testPaymentData = {
      razorpay_order_id: 'test_order_' + Date.now(),
      razorpay_payment_id: 'test_payment_' + Date.now(), 
      razorpay_signature: 'test_signature_' + Date.now()
    };

    console.log('🧪 Test payment data:', testPaymentData);
    console.log('🧪 Cart items:', cartItems);

    // Call verifyPayment directly with test data
    this.verifyPayment(testPaymentData, cartItems);
  }

  private verifyPayment(response: any, cartItems: any[]) {
    console.log('🔄 Starting payment verification...', response);
    console.log('📦 Cart items to process:', cartItems);

    const payload = {
      razorpay_order_id: response.razorpay_order_id,
      razorpay_payment_id: response.razorpay_payment_id,
      razorpay_signature: response.razorpay_signature,
      cartItems: cartItems
    };

    console.log('📤 Sending verification payload to backend:', payload);

    this.paymentSvc.verifyPaymentAndCreateOrder(payload).pipe(
      finalize(() => {
        this.loading = false;
      })
    ).subscribe({
      next: (res) => {
        console.log('✅ Backend verification response:', res);
        
        if (res && res.success) {
          console.log('🎉 Order created successfully! Order ID:', res.orderId, 'Payment ID:', res.paymentId);
          
          // Clear cart after successful order creation
          this.cart.clear().subscribe({
            next: () => {
              console.log('🛒 Cart cleared successfully');
              if (res.orderId) {
                console.log('📍 Navigating to order confirmation with order ID:', res.orderId);
                this.router.navigate(['/order-confirmation', res.orderId], {
                  queryParams: {
                    paymentId: res.paymentId,
                    message: 'Test order created successfully!'
                  }
                });
              } else {
                console.warn('⚠️ No orderId in response, navigating to generic confirmation');
                this.router.navigate(['/order-confirmation'], {
                  queryParams: {
                    message: 'Test order created successfully!'
                  }
                });
              }
            },
            error: (err) => {
              console.warn('❌ Cart clear failed:', err);
              if (res.orderId) {
                this.router.navigate(['/order-confirmation', res.orderId]);
              } else {
                this.router.navigate(['/order-confirmation']);
              }
            }
          });
        } else {
          console.error('❌ Order creation failed:', res);
          this.error = res?.message || 'Order creation failed';
          alert('Order creation failed: ' + (res?.message || 'Unknown error'));
        }
      },
      error: (err) => {
        console.error('❌ Order creation request failed:', err);
        console.error('Error details:', err.error);
        this.error = 'Order creation failed (network)';
        alert('Order creation failed. Please check console for details.');
      }
    });
  }
}