// src/app/cart/cart.component.ts
// Place this at: src/app/cart/cart.component.ts
// Colorful, stylish cart UI with polished cards + fixed checkout bar for mobile.

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService, CartItem } from '../services/cart.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <section class="cart-page">
      <!-- Hero header -->
      <header class="cart-hero">
        <div class="hero-left">
          <div class="hero-badge">🛒</div>
        </div>
        <div class="hero-content">
          <h1 class="hero-title">Your Cart</h1>
          <p class="hero-sub">Curated picks — ready to ship. Free shipping over ₹999.</p>
        </div>
      </header>

      <main class="cart-main container">
        <div *ngIf="items.length; else empty" class="items-list">
          <div *ngFor="let it of items" class="item-card">
            <div class="thumb" aria-hidden="true">👜</div>

            <div class="meta">
              <div class="title">{{ it.product.title }}</div>
              <div class="price">₹{{ it.product.price }}</div>

              <div class="qty-controls">
                <button (click)="changeQty(it.product.id, it.qty - 1)" aria-label="Decrease" class="qty-btn btn-decrease">−</button>
                <div class="qty">{{ it.qty }}</div>
                <button (click)="changeQty(it.product.id, it.qty + 1)" aria-label="Increase" class="qty-btn btn-increase">+</button>
              </div>
            </div>

            <div class="actions">
              <button (click)="remove(it.product.id)" class="remove-btn" title="Remove item">Remove</button>
            </div>
          </div>

          <!-- Summary card -->
          <aside class="summary-card">
            <div class="summary-row">
              <div class="label">Subtotal</div>
              <div class="value">₹{{ total }}</div>
            </div>

            <div class="summary-row small muted">
              <div class="label">Shipping</div>
              <div class="value">Calculated at checkout</div>
            </div>

            <div class="summary-total">
              <div class="total-label">Total</div>
              <div class="total-value">₹{{ total }}</div>
            </div>

            <button class="checkout-btn">Proceed to Checkout</button>
            <button routerLink="/" class="continue-btn">Continue shopping</button>
          </aside>
        </div>

        <!-- Empty state -->
        <ng-template #empty>
          <div class="empty-card">
            <div class="empty-emoji">😕</div>
            <h3>Your cart is empty</h3>
            <p class="muted">Looks like you haven't added anything yet.</p>
            <a routerLink="/" class="shop-link">Start shopping →</a>
          </div>
        </ng-template>
      </main>

      <!-- Mobile fixed checkout bar -->
      <div class="mobile-checkout" *ngIf="items.length > 0">
        <div class="mobile-total">
          <div class="mobile-text">Total</div>
          <div class="mobile-amount">₹{{ total }}</div>
        </div>
        <button class="mobile-checkout-btn">Checkout</button>
      </div>
    </section>
  `,
  styles: [`
    /* ---------- Layout ---------- */
    :host { display: block; font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial; color: #111; }

    .container { max-width: 980px; margin: 0 auto; padding: 1rem; }

    /* ---------- Hero ---------- */
    .cart-hero {
      display: flex;
      gap: 1rem;
      align-items: center;
      padding: 1.25rem;
      border-radius: 14px;
      margin: 1rem auto;
      max-width: 980px;
      background: linear-gradient(135deg, rgba(255,159,178,0.14), rgba(122,170,255,0.12));
      box-shadow: 0 6px 30px rgba(16,24,40,0.04);
    }
    .hero-badge {
      width:64px; height:64px; border-radius:14px;
      display:flex; align-items:center; justify-content:center;
      font-size:28px;
      background: linear-gradient(135deg,#ff9ec4,#7aaeff);
      color: white; box-shadow: 0 10px 30px rgba(122,138,255,0.18);
      transform: rotate(-8deg);
    }
    .hero-title { margin:0; font-size:1.5rem; font-weight:800; color: #1f2937; }
    .hero-sub { margin:0.25rem 0 0; color: #6b7280; }

    /* ---------- Main: grid of items + summary ---------- */
    .cart-main { padding: 0 1rem 6rem; } /* bottom padding to leave space for mobile bar */
    .items-list {
      display: grid;
      grid-template-columns: 1fr 360px;
      gap: 1rem;
      align-items: start;
    }

    /* Item card */
    .item-card {
      display: flex;
      gap: 1rem;
      align-items: center;
      padding: 1rem;
      border-radius: 12px;
      background: linear-gradient(180deg, #ffffff, #fbfbff);
      box-shadow: 0 6px 20px rgba(16,24,40,0.04);
      transition: transform .15s ease, box-shadow .15s ease;
    }
    .item-card:hover { transform: translateY(-4px); box-shadow: 0 18px 40px rgba(16,24,40,0.08); }

    .thumb {
      width:76px; height:76px; border-radius:10px; background: linear-gradient(135deg,#ffeef6,#e7f0ff);
      display:flex; align-items:center; justify-content:center; font-size:28px;
      box-shadow: inset 0 -6px 18px rgba(0,0,0,0.02);
    }

    .meta { flex: 1 1 auto; min-width: 0; }
    .title { font-weight:700; color:#111827; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .price { color:#6b7280; margin-top: 6px; }

    /* Qty controls */
    .qty-controls { display:flex; align-items:center; gap:0.5rem; margin-top: 10px; }
    .qty-btn {
      width:36px; height:36px; border-radius:9px; border: none; cursor:pointer;
      display:inline-flex; align-items:center; justify-content:center; font-size:18px; font-weight:700;
      box-shadow: 0 6px 18px rgba(13, 26, 60, 0.06);
      transition: transform .12s ease, box-shadow .12s ease;
    }
    .btn-decrease { background: linear-gradient(180deg,#ffdbe6,#ffc2dd); color:#b91c66; }
    .btn-increase { background: linear-gradient(180deg,#dbeeff,#c6e0ff); color:#0b61c3; }
    .qty-btn:active { transform: translateY(1px); box-shadow: 0 4px 10px rgba(13,26,60,0.06); }

    .qty { min-width:28px; text-align:center; font-weight:700; }

    /* Actions (Remove) */
    .actions { display:flex; align-items:center; gap:.5rem; }
    .remove-btn {
      border: none;
      background: linear-gradient(180deg,#fff1f2,#ffe6e9);
      color: #be123c;
      padding: .45rem .75rem;
      border-radius: 9px;
      cursor: pointer;
      transition: transform .12s ease, box-shadow .12s ease;
      box-shadow: 0 6px 18px rgba(203, 49, 78, 0.06);
    }
    .remove-btn:hover { transform: translateY(-3px); box-shadow: 0 14px 28px rgba(203,49,78,0.12); }

    /* ---------- Summary card (right column) ---------- */
    .summary-card {
      background: linear-gradient(180deg,#0ea5a0,#06b6d4);
      color: white;
      padding: 1rem;
      border-radius: 12px;
      box-shadow: 0 12px 40px rgba(6,95,70,0.08);
      display:flex; flex-direction:column; gap:0.75rem; align-items:stretch;
      height: fit-content;
    }
    .summary-row { display:flex; justify-content: space-between; align-items:center; font-weight:600; }
    .summary-row.small { font-weight:500; opacity:0.95; font-size:0.95rem; }
    .muted { opacity:0.9; color: rgba(255,255,255,0.9); }
    .summary-total { display:flex; justify-content:space-between; align-items:center; padding: .8rem; border-radius:10px; background: rgba(255,255,255,0.08); margin-top:.6rem; }
    .total-label { font-weight:800; }
    .total-value { font-size:1.2rem; font-weight:900; }

    .checkout-btn {
      margin-top: .75rem;
      background: linear-gradient(90deg,#fff,#e6fdf9);
      color: #054f46;
      padding: .8rem 1rem;
      border-radius: 10px;
      font-weight:800;
      border: none;
      cursor:pointer;
      box-shadow: 0 10px 26px rgba(6,95,70,0.08);
    }
    .continue-btn {
      margin-top: .5rem;
      background: transparent;
      color: rgba(255,255,255,0.95);
      border: 1px solid rgba(255,255,255,0.12);
      padding: .6rem;
      border-radius: 10px;
      cursor:pointer;
    }

    /* ---------- Empty state ---------- */
    .empty-card {
      max-width:560px;
      margin: 2rem auto;
      background: linear-gradient(180deg,#ffffff,#fbfdff);
      padding: 2rem;
      border-radius: 12px;
      box-shadow: 0 8px 30px rgba(2,6,23,0.04);
      text-align:center;
    }
    .empty-emoji { font-size:48px; margin-bottom:8px; }
    .shop-link { display:inline-block; margin-top:10px; color:#ff6aa3; font-weight:700; }

    /* ---------- Mobile: stack and fixed checkout bar ---------- */
    @media (max-width: 880px) {
      .items-list { grid-template-columns: 1fr; }
      .summary-card { order: 2; margin-top: 0.75rem; }
      .item-card { padding: .75rem; }
      .cart-main { padding-bottom: 110px; } /* allow for fixed bottom bar */
    }

    .mobile-checkout {
      position: fixed;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: .75rem;
      padding: .65rem;
      background: linear-gradient(90deg,#0ea5a0,#06b6d4);
      color: white;
      box-shadow: 0 -10px 30px rgba(6,95,70,0.12);
      z-index: 1200;
    }
    .mobile-total .mobile-text { font-size: 0.9rem; opacity:.95; }
    .mobile-total .mobile-amount { font-weight:900; font-size:1.05rem; }
    .mobile-checkout-btn {
      background: white;
      color: #0b7285;
      padding: .6rem 1rem;
      border-radius: 10px;
      font-weight:800;
      border: none;
      box-shadow: 0 8px 22px rgba(12, 74, 82, 0.12);
      cursor: pointer;
    }

    /* small polish */
    a { color: inherit; text-decoration: none; }
    .muted { color: #6b7280; }
  `]
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
    // keep qty >= 1
    if (qty < 1) qty = 1;
    this.cart.updateQty(id, qty);
  }

  remove(id: string) {
    this.cart.remove(id);
  }

  private computeTotal() {
    this.total = this.items.reduce((s, it) => s + it.product.price * it.qty, 0);
  }
}
