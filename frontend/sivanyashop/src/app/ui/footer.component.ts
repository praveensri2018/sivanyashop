// Replace file: src/app/ui/footer.component.ts
import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription, Observable } from 'rxjs';
import { AuthService, UserPayload } from '../auth/auth.service';
import { CartService } from '../services/cart.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent implements OnInit, OnDestroy {
  year = new Date().getFullYear();

  currentUser: UserPayload | null = null;
  role: 'admin' | 'retailer' | 'customer' | null = null;

  cartCount$!: Observable<number>;
  private authSub?: Subscription;

  constructor(private auth: AuthService, private cart: CartService) {
    this.cartCount$ = this.cart.count$;
  }

  ngOnInit(): void {
  // initial load
  try { this.currentUser = this.auth.getUser(); } catch { this.currentUser = null; }
  this.normalizeRole();

  // subscribe to changes
  this.auth.currentUser$?.subscribe?.((u: UserPayload | null) => {
    this.currentUser = u;
    this.normalizeRole();
  });

  window.addEventListener('storage', this._onStorageEvent);
}

  ngOnDestroy(): void {
    this.authSub?.unsubscribe();
    window.removeEventListener('storage', this._onStorageEvent);
  }

  private _onStorageEvent = (e: StorageEvent) => {
    if (e.key === 'user' || e.key === 'currentUser' || e.key === 'token') {
      try { this.currentUser = this.auth.getUser(); } catch { this.currentUser = null; }
      this.normalizeRole();
    }
  };

  private normalizeRole() {
    const r = this.currentUser?.role ?? null;
    if (!r) { this.role = null; return; }
    const rr = String(r).toUpperCase();
    if (rr === 'ADMIN') this.role = 'admin';
    else if (rr === 'RETAILER') this.role = 'retailer';
    else if (rr === 'CUSTOMER') this.role = 'customer';
    else this.role = null;
  }

  // designVariant used by footer template to show admin vs others
  get designVariant(): 'guest' | 'admin' | 'customer' {
    if (!this.role) return 'guest';
    if (this.role === 'admin') return 'admin';
    return 'customer'; // retailer and customer share layout
  }

  toggleMobileCategories() {
    try {
      window.dispatchEvent(new Event('toggleMobileCategories'));
    } catch (e) {
      console.warn('toggleMobileCategories dispatch failed', e);
    }
  }

  logout() {
    if (typeof (this.auth as any).logout === 'function') {
      (this.auth as any).logout();
    } else {
      localStorage.removeItem('user');
      localStorage.removeItem('currentUser');
      localStorage.removeItem('token');
      sessionStorage.removeItem('user');
    }
    try { this.currentUser = this.auth.getUser(); } catch { this.currentUser = null; }
    this.normalizeRole();
  }
}
