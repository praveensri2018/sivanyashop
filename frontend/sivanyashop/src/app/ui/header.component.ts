// ✅ FILE: src/app/ui/header.component.ts
import { Component, ElementRef, HostListener, OnInit, OnDestroy } from '@angular/core';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';
import { CartService } from '../services/cart.service';
import { AuthService, UserPayload } from '../auth/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit, OnDestroy {
  cartCount$!: Observable<number>;

  currentUser: UserPayload | null = null;
  role: 'admin' | 'retailer' | 'customer' | null = null;
  private authSub?: Subscription;

  // scroll state for sticky header
  isScrolled = false;
  private ticking = false;

  // user dropdown menu
  isUserMenuOpen = false;

  // search
  query = '';
  suggestions: string[] = [
    'Floral summer top',
    'Casual tee',
    'Elegant kurti',
    'Stylish palazzo',
    'Trendy denim jacket',
    'Party dress'
  ];
  filteredSuggestions: string[] = [];
// Add these methods to your existing header.component.ts

handleTouchEnd(event: TouchEvent): void {
  event.preventDefault();
  this.toggleUserMenu(event);
}

handleLogout(): void {
  this.logout();
  this.closeUserMenu();
  if (this.isMobileMenuOpen) {
    this.toggleMobileMenu();
  }
}


  categories = ['Women', 'Men', 'Kids', 'Home', 'Accessories', 'Beauty'];
  mobileCatsVisible = false;

  // custom event listener ref (for cleanup)
  private _footerToggleListener = () => this.toggleMobileCategories();

  constructor(
    private cart: CartService,
    private host: ElementRef,
    private router: Router,
    private auth: AuthService
  ) {
    this.cartCount$ = this.cart.count$;
    this.filteredSuggestions = [...this.suggestions];
  }

  // --------------------------
  // 🔹 INIT & CLEANUP
  // --------------------------
  ngOnInit(): void {
    // get initial user state
    try {
      this.currentUser = this.auth.getUser();
    } catch {
      this.currentUser = null;
    }
    this.normalizeRole();

    // subscribe to user auth changes (if observable exists)
    const maybeObs: any = (this.auth as any).currentUser$;
    if (maybeObs && typeof maybeObs.subscribe === 'function') {
      this.authSub = maybeObs.subscribe((u: UserPayload | null) => {
        this.currentUser = u;
        this.normalizeRole();
      });
    }

    // listen for storage changes (token/user updates)
    window.addEventListener('storage', this._onStorageEvent);
    window.addEventListener('toggleMobileCategories', this._footerToggleListener);

    this.checkScroll();
  }

  ngOnDestroy(): void {
    this.authSub?.unsubscribe();
    window.removeEventListener('storage', this._onStorageEvent);
    window.removeEventListener('toggleMobileCategories', this._footerToggleListener);
  }

  // --------------------------
  // 🔹 USER MENU
  // --------------------------
  toggleUserMenu(ev?: Event) {
    if (ev) ev.stopPropagation();
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  closeUserMenu() {
    this.isUserMenuOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(ev: MouseEvent) {
    const hostEl = this.host.nativeElement as HTMLElement;
    if (!hostEl.contains(ev.target as Node)) {
      this.isUserMenuOpen = false;
    }
  }

  // --------------------------
  // 🔹 SCROLL BEHAVIOR
  // --------------------------
  @HostListener('window:scroll', [])
  @HostListener('document:scroll', [])
  @HostListener('window:touchmove', [])
  onWindowScroll(): void {
    this.checkScroll();
  }

  private checkScroll() {
    const y = window.scrollY || window.pageYOffset || 0;
    if (!this.ticking) {
      this.ticking = true;
      window.requestAnimationFrame(() => {
        this.isScrolled = y > 20;
        this.ticking = false;
      });
    }
  }

  // --------------------------
  // 🔹 AUTH & ROLE
  // --------------------------
  private _onStorageEvent = (e: StorageEvent) => {
    if (['user', 'currentUser', 'token'].includes(e.key || '')) {
      try {
        this.currentUser = this.auth.getUser();
      } catch {
        this.currentUser = null;
      }
      this.normalizeRole();
    }
  };

  private normalizeRole() {
    const r = this.currentUser?.role ?? null;
    if (!r) {
      this.role = null;
      return;
    }

    const rr = String(r).toUpperCase();
    if (rr === 'ADMIN') this.role = 'admin';
    else if (rr === 'RETAILER') this.role = 'retailer';
    else if (rr === 'CUSTOMER') this.role = 'customer';
    else this.role = null;
  }

  get designVariant(): 'guest' | 'admin' | 'customer' {
    if (!this.role) return 'guest';
    if (this.role === 'admin') return 'admin';
    return 'customer';
  }

  // --------------------------
  // 🔹 SEARCH & NAVIGATION
  // --------------------------
  onInput(ev: Event) {
    this.query = (ev.target as HTMLInputElement).value;
  }

  onSearch() {
  const q = this.query?.trim() || null;

  // Determine destination based on role
  let baseRoute = '/';
  if (this.role === 'admin') {
    baseRoute = '/admin';
  } else if (this.role === 'retailer' || this.role === 'customer' || !this.role) {
    baseRoute = '/';
  }

  // 🟢 If search is empty → remove queryParams (shows all)
  if (!q) {
    this.router.navigate([baseRoute]); // shows all products
  } else {
    this.router.navigate([baseRoute], { queryParams: { q } });
  }

  // Close dropdown
  this.closeUserMenu();
}
  // --------------------------
  // 🔹 MOBILE CATEGORIES
  // --------------------------
  toggleMobileCategories() {
    this.mobileCatsVisible = !this.mobileCatsVisible;
  }

  // --------------------------
  // 🔹 LOGOUT
  // --------------------------
  logout() {
    if (typeof (this.auth as any).logout === 'function') {
      (this.auth as any).logout();
    } else {
      localStorage.removeItem('user');
      localStorage.removeItem('currentUser');
      localStorage.removeItem('token');
      sessionStorage.removeItem('user');
    }

    this.currentUser = null;
    this.role = null;
    this.closeUserMenu();
    this.router.navigate(['/']);
  }

  
isMobileMenuOpen = false;

toggleMobileMenu(): void {
  this.isMobileMenuOpen = !this.isMobileMenuOpen;
  // Close user menu when mobile menu opens
  if (this.isMobileMenuOpen) {
    this.isUserMenuOpen = false;
  }
}


getHomeRoute(): string {
  return this.role === 'admin' ? '/admin' : '/';
}

getDashboardRoute(): string {
  switch (this.role) {
    case 'admin': return '/admin';
    case 'retailer': return '/retailer';
    case 'customer': return '/dashboard';
    default: return '/login';
  }
}

getSearchPlaceholder(): string {
  switch (this.role) {
    case 'admin': return 'Search orders, users, SKUs...';
    case 'retailer': return 'Search products, orders...';
    default: return 'Search products, brands and more...';
  }
}

getRoleDisplayName(): string {
  switch (this.role) {
    case 'admin': return 'Administrator';
    case 'retailer': return 'Retailer';
    case 'customer': return 'Customer';
    default: return 'Guest';
  }
}

}
