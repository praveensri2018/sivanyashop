// Place file at: src/app/ui/header.component.ts
import { Component, ElementRef, HostListener, OnInit, OnDestroy } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
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

  // scroll state for sticky/shrink header
  isScrolled = false;
  private ticking = false;

  // USER MENU (mobile-friendly)
  isUserMenuOpen = false;

  // search
  query = '';
  suggestions: string[] = [
    'Floral summer top', 'Casual tee', 'Elegant kurti', 'Stylish palazzo', 'Trendy denim jacket', 'Party dress'
  ];
  filteredSuggestions: string[] = [];

  categories = ['Women', 'Men', 'Kids', 'Home', 'Accessories', 'Beauty'];
  mobileCatsVisible = false;

  // keep references for listeners so we can remove them
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

  ngOnInit(): void {
  // initial user state
  try { this.currentUser = this.auth.getUser(); } catch { this.currentUser = null; }
  this.normalizeRole();

  // DEBUG: force menu open on load to verify rendering
  this.isUserMenuOpen = true;
  console.log('[DEBUG] header init: isUserMenuOpen forced true, currentUser=', this.currentUser);

  // subscribe to auth changes ...
  const maybeObs: any = (this.auth as any).currentUser$;
  if (maybeObs && typeof maybeObs.subscribe === 'function') {
    this.authSub = maybeObs.subscribe((u: UserPayload | null) => {
      this.currentUser = u;
      this.normalizeRole();
    });
  }

  window.addEventListener('storage', this._onStorageEvent);
  window.addEventListener('toggleMobileCategories', this._footerToggleListener);

  this.checkScroll();
}


  ngOnDestroy(): void {
    this.authSub?.unsubscribe();
    window.removeEventListener('storage', this._onStorageEvent);
    window.removeEventListener('toggleMobileCategories', this._footerToggleListener);
  }

  // ---------- user menu controls ----------
toggleUserMenu(ev?: Event) {
  if (ev && ev.stopPropagation) ev.stopPropagation();
  console.log('[DEBUG] toggleUserMenu called; before=', this.isUserMenuOpen, 'event=', ev?.type);
  this.isUserMenuOpen = !this.isUserMenuOpen;
  console.log('[DEBUG] toggleUserMenu after=', this.isUserMenuOpen);
}

  closeUserMenu() {
    this.isUserMenuOpen = false;
  }

  @HostListener('document:click', ['$event'])
onDocumentClick(ev: MouseEvent) {
  const hostEl = this.host && (this.host.nativeElement as HTMLElement);
  if (!hostEl) return;
  if (!hostEl.contains(ev.target as Node)) {
    if (this.isUserMenuOpen) {
      console.log('[DEBUG] document click outside - closing user menu');
    }
    this.isUserMenuOpen = false;
  }
}

  // ---------- scroll handling ----------
  @HostListener('window:scroll', [])
  @HostListener('document:scroll', [])
  @HostListener('window:touchmove', [])
  onWindowScroll(): void { this.checkScroll(); }

  private checkScroll() {
    const y = (window.scrollY || window.pageYOffset || 0);
    if (!this.ticking) {
      this.ticking = true;
      window.requestAnimationFrame(() => {
        this.isScrolled = y > 20;
        this.ticking = false;
      });
    }
  }

  // ---------- auth / role helpers ----------
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

  get designVariant(): 'guest' | 'admin' | 'customer' {
    if (!this.role) return 'guest';
    if (this.role === 'admin') return 'admin';
    return 'customer';
  }

  onInput(ev: Event) { this.query = (ev.target as HTMLInputElement).value; }
  toggleMobileCategories() { this.mobileCatsVisible = !this.mobileCatsVisible; }

  onSearch() {
    if (!this.query?.trim()) return;
    this.router.navigate(['/search'], { queryParams: { q: this.query } });
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
    this.currentUser = null;
    this.role = null;
    this.closeUserMenu();
    this.router.navigate(['/']);
  }
}
