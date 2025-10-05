// Place file at: src/app/ui/header.component.ts
import { Component, ElementRef, HostListener, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { CartService } from '../services/cart.service'; // <-- FIXED path (one level up)

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  count$: Observable<number>;
  query = '';
  selectedCategory = '';
  showSuggestions = false;
  suggestions: string[] = ['Floral summer top','Casual tee','Elegant kurti','Stylish palazzo','Trendy denim jacket','Party dress'];
  filteredSuggestions: string[] = [];

  categories = ['Women','Men','Kids','Home','Accessories','Beauty'];
  mobileCatsVisible = false;

  locState: 'idle' | 'detecting' | 'granted' | 'denied' | 'error' = 'idle';
  location = 'Select location';
  lat?: number;
  lon?: number;

  constructor(private cart: CartService, private host: ElementRef) {
    this.count$ = this.cart.count$;
    this.filteredSuggestions = [...this.suggestions];
  }

  ngOnInit(): void {
    this.requestLocation();
  }

  async requestLocation() {
    if (!('geolocation' in navigator)) {
      this.locState = 'error';
      this.location = 'Geolocation not supported';
      return;
    }

    this.locState = 'detecting';
    this.location = 'Detecting…';

    const opts: PositionOptions = { enableHighAccuracy: false, timeout: 8000, maximumAge: 60_000 };

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          this.lat = pos.coords.latitude;
          this.lon = pos.coords.longitude;
          const label = await this.reverseGeocode(this.lat, this.lon);
          this.location = label ?? `${this.round(this.lat)}, ${this.round(this.lon)}`;
          this.locState = 'granted';
        } catch (err) {
          console.error('Reverse geocoding failed', err);
          this.location = `${this.round(pos.coords.latitude)}, ${this.round(pos.coords.longitude)}`;
          this.locState = 'granted';
        }
      },
      (err) => {
        console.warn('Geolocation error', err);
        if (err.code === 1) {
          this.locState = 'denied';
          this.location = 'Location blocked';
        } else if (err.code === 3) {
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

  private round(n?: number) {
    if (n == null) return '';
    return n.toFixed(4);
  }

  private async reverseGeocode(lat: number, lon: number): Promise<string | null> {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&addressdetails=1`;
      const resp = await fetch(url, { headers: { 'Accept': 'application/json' } });

      if (!resp.ok) {
        console.warn('Nominatim returned non-OK', resp.status);
        return null;
      }

      const data = await resp.json();
      const addr = data.address || {};
      const place = addr.city || addr.town || addr.village || addr.county || addr.state;
      const postcode = addr.postcode;
      let label = '';
      if (place) label += place;
      if (postcode) label += label ? ` ${postcode}` : `${postcode}`;
      if (!label && data.display_name) {
        label = data.display_name.split(',').slice(0, 2).join(',').trim();
      }
      return label || null;
    } catch (e) {
      console.error('Reverse geocode failed', e);
      return null;
    }
  }

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

  @HostListener('document:click', ['$event'])
  onDocClick(ev: MouseEvent) {
    const el = this.host.nativeElement as HTMLElement;
    if (!el.contains(ev.target as Node)) {
      this.showSuggestions = false;
    }
  }
}
