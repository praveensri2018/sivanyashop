// src/app/ui/header.component.ts
// Place file at: src/app/ui/header.component.ts
//
// Adds automatic location detection (with user permission). The component:
//  - attempts to get geolocation via navigator.geolocation
//  - uses OpenStreetMap Nominatim reverse-geocoding to get a readable location (city + postcode)
//  - displays "Detecting..." while waiting, shows coordinates or a short message on failure
//  - is defensive: handles permission denied, timeouts and network errors
//
// IMPORTANT: Nominatim is a free public service with rate-limits and usage policies.
// For production workloads use a paid geocoding provider or your own proxy.
import { Component, ElementRef, HostListener, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { CartService } from '../services/cart.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <!-- PROMO STRIP (same as before) -->
    <div class="promo-strip d-flex align-items-center justify-content-center text-white">
      <div class="container d-flex align-items-center justify-content-between py-1">
        <div class="promo-text small">
          🎉 Limited-time: Flat 30% off on new arrivals — Use code <b>WELCOME30</b>
        </div>
        <div class="promo-actions small d-none d-md-flex gap-3 align-items-center">
          <a routerLink="/" class="text-white text-decoration-underline">Shop Offers</a>
          <a routerLink="/login" class="text-white">Sign in for extra benefits</a>
        </div>
      </div>
    </div>

    <!-- NAVBAR -->
    <header class="navbar navbar-expand-lg navbar-light bg-white shadow-sm sticky-top">
      <div class="container d-flex align-items-center gap-3">
        <!-- BRAND -->
        <a class="brand d-flex align-items-center gap-2 text-decoration-none" routerLink="/">
          <div class="logo-badge d-flex align-items-center justify-content-center">ST</div>
          <div class="brand-text">
            <div class="h6 mb-0">Sivanuya Trends Tops</div>
            <small class="text-muted"></small>
          </div>
        </a>

        <!-- LOCATION SELECTOR (now shows detection status) -->
        <div class="location d-none d-md-flex align-items-center gap-2 ms-3" title="Click to re-detect location">
          <i class="bi bi-geo-alt-fill text-muted" aria-hidden="true"></i>
          <div class="location-select" role="button" tabindex="0" (click)="requestLocation()" (keydown.enter)="requestLocation()">
            <div class="small text-muted">Deliver to</div>

            <!-- show statuses: detecting -> spinner, success -> location, error -> message -->
            <div class="fw-semibold location-value">
              <ng-container *ngIf="locState === 'idle'">{{ location }}</ng-container>
              <ng-container *ngIf="locState === 'detecting'">
                Detecting… <span class="spinner-border spinner-border-sm ms-1" role="status" aria-hidden="true"></span>
              </ng-container>
              <ng-container *ngIf="locState === 'granted'">{{ location }}</ng-container>
              <ng-container *ngIf="locState === 'denied'">Location blocked</ng-container>
              <ng-container *ngIf="locState === 'error'">Unable to detect</ng-container>
            </div>
          </div>
        </div>

        <!-- SEARCH (center) -->
        <div class="flex-fill px-3">
          <div class="search-wrap position-relative">
            <form class="d-flex" (submit)="onSearchSubmit($event)">
              <div class="input-group w-100">
                <select class="form-select categories-select d-none d-lg-inline-block" [(ngModel)]="selectedCategory" name="cat">
                  <option value="">All Categories</option>
                  <option *ngFor="let c of categories" [value]="c">{{ c }}</option>
                </select>

                <input
                  type="text"
                  class="form-control search-input"
                  placeholder="Search products, brands and more"
                  [(ngModel)]="query"
                  name="q"
                  (input)="onInput($event)"
                  aria-label="Search products"
                />

                <button class="btn btn-primary search-btn" type="submit" aria-label="Search">Search</button>
              </div>
            </form>

            <!-- lightweight suggestions -->
            <div class="suggestions card mt-1" *ngIf="showSuggestions && filteredSuggestions.length > 0">
              <div class="list-group list-group-flush">
                <a
                  *ngFor="let s of filteredSuggestions"
                  class="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                  (click)="selectSuggestion(s)"
                >
                  <div>{{ s }}</div>
                </a>
              </div>
            </div>
          </div>
        </div>

        <!-- ACTIONS -->
        <div class="actions d-flex align-items-center gap-2 ms-2">
          <a routerLink="/orders" class="btn btn-sm btn-outline-secondary d-none d-md-inline">Orders</a>

          <a routerLink="/cart" class="btn btn-outline-primary position-relative me-1" aria-label="Cart">
            <i class="bi bi-cart-fill"></i>
            <span class="ms-1 d-none d-md-inline">Cart</span>

            <ng-container *ngIf="count$ | async as c">
              <span *ngIf="c > 0" class="badge bg-danger position-absolute top-0 start-100 translate-middle">{{ c }}</span>
            </ng-container>
          </a>

          <div class="dropdown">
            <button class="btn btn-sm btn-outline-dark dropdown-toggle" type="button" id="userMenu" data-bs-toggle="dropdown" aria-expanded="false">
              <i class="bi bi-person-circle"></i>
              <span class="d-none d-md-inline ms-1">Account</span>
            </button>
            <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="userMenu">
              <li><a class="dropdown-item" routerLink="/login">Sign in</a></li>
              <li><a class="dropdown-item" routerLink="/dashboard">Your Dashboard</a></li>
              <li><hr class="dropdown-divider"></li>
              <li><a class="dropdown-item" routerLink="/orders">Your Orders</a></li>
            </ul>
          </div>
        </div>
      </div>
    </header>

    <!-- MOBILE CATEGORIES PANEL (unchanged) -->
    <div class="mobile-cats card shadow-sm" *ngIf="mobileCatsVisible">
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <strong>Categories</strong>
          <button class="btn btn-sm btn-light" (click)="toggleMobileCategories()">Close</button>
        </div>
        <div class="list-group">
          <a *ngFor="let c of categories" class="list-group-item list-group-item-action">{{ c }}</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display:block; z-index: 1050; }
    .promo-strip { background: linear-gradient(90deg,#ff6aa3,#6b8cff); font-weight:600; font-size:.92rem; box-shadow: 0 2px 6px rgba(11,17,35,0.06); }
    .logo-badge { width:48px; height:48px; background: linear-gradient(135deg,#ff9ec4,#7aaeff); color:white; font-weight:700; border-radius:10px; display:flex; align-items:center; justify-content:center; box-shadow: 0 6px 18px rgba(122,138,255,0.18); font-size:1.05rem; transform: rotate(-6deg); transition: transform .25s ease; }
    .brand:hover .logo-badge { transform: rotate(0) scale(1.03); }
    .location { cursor:pointer; }
    .search-wrap { position: relative; }
    .suggestions { position:absolute; left:0; right:0; z-index:1200; border-radius:.5rem; overflow:hidden; }
    .actions .btn { min-width:48px; }
    .badge { font-size:.7rem; padding:.35rem .45rem; }
    @media (max-width: 991px) {
      .categories-select { display:none; }
      .brand-text small { display:none; }
      .promo-actions { display:none; }
    }
  `]
})
export class HeaderComponent implements OnInit {
  // cart
  count$: Observable<number>;

  // search fields
  query = '';
  selectedCategory = '';
  showSuggestions = false;
  suggestions: string[] = ['Floral summer top','Casual tee','Elegant kurti','Stylish palazzo','Trendy denim jacket','Party dress'];
  filteredSuggestions: string[] = [];

  // categories
  categories = ['Women','Men','Kids','Home','Accessories','Beauty'];
  mobileCatsVisible = false;

  // location state
  // locState: 'idle' | 'detecting' | 'granted' | 'denied' | 'error'
  locState: 'idle' | 'detecting' | 'granted' | 'denied' | 'error' = 'idle';
  location = 'Select location'; // shown text in header
  // store raw lat/lon to display if needed
  lat?: number;
  lon?: number;

  constructor(private cart: CartService, private host: ElementRef) {
    this.count$ = this.cart.count$;
    this.filteredSuggestions = [...this.suggestions];
  }

  ngOnInit(): void {
    // try to request location once when header initializes (non-aggressive)
    // This will prompt the user for permission in the browser.
    this.requestLocation();
  }

  /**
   * Request the browser for geolocation permission and coordinates.
   * Steps:
   *  1) set locState to 'detecting' so UI shows spinner
   *  2) call navigator.geolocation.getCurrentPosition with timeout
   *  3) on success: store lat/lon and call reverseGeocode()
   *  4) on error: set locState appropriately
   */
  async requestLocation() {
    // guard: does browser support geolocation?
    if (!('geolocation' in navigator)) {
      this.locState = 'error';
      this.location = 'Geolocation not supported';
      return;
    }

    // update UI state
    this.locState = 'detecting';
    this.location = 'Detecting…';

    // attempt to get position with a reasonable timeout
    const opts: PositionOptions = { enableHighAccuracy: false, timeout: 8000, maximumAge: 60_000 };

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          this.lat = pos.coords.latitude;
          this.lon = pos.coords.longitude;
          // call reverse geocoding to get human-readable string
          const label = await this.reverseGeocode(this.lat, this.lon);
          this.location = label ?? `${this.round(this.lat)}, ${this.round(this.lon)}`;
          this.locState = 'granted';
        } catch (err) {
          // geocode failed — but we still have coordinates
          console.error('Reverse geocoding failed', err);
          this.location = `${this.round(pos.coords.latitude)}, ${this.round(pos.coords.longitude)}`;
          this.locState = 'granted';
        }
      },
      (err) => {
        console.warn('Geolocation error', err);
        if (err.code === 1) { // PERMISSION_DENIED
          this.locState = 'denied';
          this.location = 'Location blocked';
        } else if (err.code === 3) { // TIMEOUT
          this.locState = 'error';
          this.location = 'Location timeout';
        } else {
          this.locState = 'error';
          this.location = 'Unable to detect';
        }
      },
      opts
    );
  }

  // small helper for rounding coords
  private round(n?: number) {
    if (n == null) return '';
    return n.toFixed(4);
  }

  /**
   * Reverse-geocode lat/lon using OpenStreetMap Nominatim.
   * Returns a short label like "Mumbai 400001" or null on failure.
   *
   * NOTE: Nominatim has usage policies and rate limits. For production, use a paid geocoding provider or run your own proxy.
   */
  private async reverseGeocode(lat: number, lon: number): Promise<string | null> {
    try {
      // Nominatim reverse geocode endpoint (format=json)
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&addressdetails=1`;
      const resp = await fetch(url, {
        headers: {
          // Helpful to include a descriptive header, but browsers may block setting 'User-Agent'.
          // Keep Accept header; don't set aggressive headers to avoid CORS problems.
          'Accept': 'application/json'
        }
      });

      if (!resp.ok) {
        console.warn('Nominatim returned non-OK', resp.status);
        return null;
      }

      const data = await resp.json();
      // Try to build a compact label: city / town / village + postcode if available
      const addr = data.address || {};
      const place = addr.city || addr.town || addr.village || addr.county || addr.state;
      const postcode = addr.postcode;
      let label = '';
      if (place) label += place;
      if (postcode) label += label ? ` ${postcode}` : `${postcode}`;
      if (!label && data.display_name) {
        // fallback to a trimmed display_name (first two parts)
        label = data.display_name.split(',').slice(0, 2).join(',').trim();
      }
      return label || null;
    } catch (e) {
      console.error('Reverse geocode failed', e);
      return null;
    }
  }

  // --- small search and suggestions code (unchanged) ---
  onInput(ev: Event) {
    const val = (ev.target as HTMLInputElement).value;
    this.query = val;
    this.updateSuggestions(val);
  }

  updateSuggestions(q: string) {
    if (!q || q.trim().length < 1) {
      this.filteredSuggestions = [];
      this.showSuggestions = false;
      return;
    }
    const low = q.toLowerCase();
    this.filteredSuggestions = this.suggestions.filter(s => s.toLowerCase().includes(low)).slice(0, 6);
    this.showSuggestions = this.filteredSuggestions.length > 0;
  }

  selectSuggestion(s: string) {
    this.query = s;
    this.showSuggestions = false;
  }

  onSearchSubmit(e: Event) {
    e.preventDefault();
    this.showSuggestions = false;
    console.log('search for', this.query, 'category', this.selectedCategory);
  }

  toggleMobileCategories() { this.mobileCatsVisible = !this.mobileCatsVisible; }

  // close suggestions when clicking outside
  @HostListener('document:click', ['$event'])
  onDocClick(ev: MouseEvent) {
    const el = this.host.nativeElement as HTMLElement;
    if (!el.contains(ev.target as Node)) {
      this.showSuggestions = false;
    }
  }
}
