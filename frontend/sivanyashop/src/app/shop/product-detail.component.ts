// Place file at: src/app/shop/product-detail.component.ts
// Full file (updated): prevents adding to cart when not logged in.
// If user is not logged in, navigates to /login with redirect + variant/qty in query params.
// If logged in, proceeds to call CartService.add as before.

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { ProductService } from '../services/product.service';
import { Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CartService } from '../services/cart.service';

// ADDED: import AuthService to check login state
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.scss']
})
export class ProductDetailComponent implements OnInit {
  product: any | null = null;
  loading = false;
  error: string | null = null;

  mainImage: string | null = null;
  images: string[] = [];
  selectedVariantId: number | null = null;
  selectedVariant: any = null;
  quantity = 1;

  // UPDATED: inject AuthService
  constructor(
    private route: ActivatedRoute,
    private svc: ProductService,
    private location: Location,
    private router: Router,
    private cart: CartService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.loadProduct(id);
  }

  private getIdFromProduct(p: any): number | null {
    return p?.id ?? p?.Id ?? p?.ProductId ?? null;
  }
  private getNameFromProduct(p: any): string {
    return p?.name ?? p?.Name ?? p?.ProductName ?? 'Product';
  }
  private getVariantsFromProduct(p: any): any[] {
    return p?.variants ?? p?.Variants ?? p?.productVariants ?? p?.product_variants ?? [];
  }
  private getImagesFromProduct(p: any): string[] {
    const imgs = p?.images ?? p?.Images ?? p?.ImageUrls ?? p?.imagesList ?? [];
    if (Array.isArray(imgs)) return imgs.map((it: any) => (typeof it === 'string' ? it : (it.ImageUrl ?? it.url ?? it.path ?? ''))).filter(Boolean);
    if (typeof imgs === 'string' && imgs.length) return imgs.split(',').map((s: string) => s.trim()).filter(Boolean);
    const path = p?.ImagePath ?? p?.imagePath ?? p?.image ?? null;
    return path ? [path] : [];
  }

  loadProduct(id: string) {
    this.loading = true;
    this.error = null;
    this.svc.fetchProductById(id).subscribe({
      next: (res: any) => {
        const product = res?.product ?? res ?? null;
        this.product = product;

        this.images = this.getImagesFromProduct(product);
        this.mainImage = this.images.length ? this.images[0] : (product?.ImagePath ?? '/assets/placeholder.png');

        const variants = this.getVariantsFromProduct(product);
        if (Array.isArray(variants) && variants.length) {
          const first = variants[0];
          this.selectedVariantId = first?.Id ?? first?.id ?? null;
          this.mapSelectedVariant();
        } else {
          this.selectedVariantId = null;
          this.selectedVariant = null;
        }

        this.loading = false;
      },
      error: (err) => {
        console.error('fetch product failed', err);
        this.error = err?.error?.message ?? err?.message ?? 'Failed to load product';
        this.loading = false;
      }
    });
  }

  setMainImage(url: string) {
    if (!url) return;
    this.mainImage = url;
  }

  onSelectVariant(variantId: number) {
    this.selectedVariantId = variantId;
    this.mapSelectedVariant();
  }

  private mapSelectedVariant() {
    if (!this.product) { this.selectedVariant = null; return; }
    const variantsRaw = this.getVariantsFromProduct(this.product);
    this.selectedVariant = (variantsRaw || []).find((v: any) => {
      const id = v?.Id ?? v?.id;
      return id === this.selectedVariantId;
    }) || null;

    if (this.selectedVariant) {
      if (this.selectedVariant.price == null) {
        const prices = this.selectedVariant.prices ?? this.selectedVariant.Prices ?? [];
        const cp = Array.isArray(prices) ? prices.find((x:any) => (x.PriceType ?? x.priceType) === 'CUSTOMER') : null;
        this.selectedVariant.price = cp?.Price ?? cp?.price ?? this.selectedVariant.customerPrice ?? this.selectedVariant.CustomerPrice ?? null;
      }
    }
  }

  getDisplayedPrice(): number | null {
    if (this.selectedVariant && (this.selectedVariant.price !== undefined && this.selectedVariant.price !== null)) {
      return Number(this.selectedVariant.price);
    }

    const variantsRaw = this.getVariantsFromProduct(this.product);
    let min: number | null = null;
    for (const v of (variantsRaw || [])) {
      let p = v?.price ?? v?.customerPrice ?? null;
      if (p == null) {
        const prices = v?.prices ?? v?.Prices ?? [];
        const cp = Array.isArray(prices) ? prices.find((x:any) => (x.PriceType ?? x.priceType) === 'CUSTOMER') : null;
        p = cp?.Price ?? cp?.price ?? null;
      }
      if (p != null) {
        const num = Number(p);
        if (min == null || num < min) min = num;
      }
    }
    return min;
  }

  canAddToCart(): boolean {
    const hasVariants = (this.getVariantsFromProduct(this.product) || []).length > 0;
    if (hasVariants && !this.selectedVariantId) return false;
    return this.product != null && this.quantity > 0;
  }

  // UPDATED: prevent add-to-cart when not logged in; redirect to /login with return info
  addToCart() {
    // If user not logged in -> navigate to login (do not add to cart)
    const token = this.auth.getToken ? this.auth.getToken() : null;
    const isLoggedIn = !!token;

    // If not logged in, redirect to login and include return info in query params
    if (!isLoggedIn) {
      const pid = this.getIdFromProduct(this.product);
      const queryParams: any = { redirect: `/product/${pid}` };
      if (this.selectedVariantId) queryParams.variant = String(this.selectedVariantId);
      if (this.quantity) queryParams.qty = String(this.quantity || 1);

      // Optional: show a confirmation prompt (uncomment if desired)
      // if (!confirm('You need to login to add items to cart. Go to login page now?')) return;

      // navigate to login (user will be expected to login and then come back)
      this.router.navigate(['/login'], { queryParams }).catch(err => console.warn('nav to login failed', err));
      return;
    }

    // Logged in -> proceed to add to cart as before
    if (!this.canAddToCart()) { 
      alert('Select a variant and quantity'); 
      return; 
    }

    const pid = this.getIdFromProduct(this.product);
    if (!pid) {
      console.error('Invalid product id, cannot add to cart', this.product);
      alert('Cannot add: invalid product');
      return;
    }

    const variant = this.selectedVariant;
    const payload: { productId: number, variantId?: number | null, qty: number, price?: number | null } = {
      productId: pid,
      variantId: variant?.Id ?? variant?.id ?? null,
      qty: Number(this.quantity || 1),
      price: this.getDisplayedPrice() ?? null
    };

    // call CartService (injected as this.cart)
    this.cart.add(payload).subscribe({
      next: (res: any) => {
        if (res?.local) {
          alert('✅ Added to local cart (not signed in).');
        } else if (res?.success) {
          alert('✅ Added to cart (server).');
        } else {
          alert('✅ Added to cart.');
        }
      },
      error: (err) => {
        console.error('Add to cart failed', err);
        alert('Failed to add to cart');
      }
    });
  }


  addToWishlist() {
    alert('Added to wishlist (demo)');
  }

  goBack() {
    try { this.location.back(); } catch { this.router.navigate(['/']); }
  }

  getProductTitle(): string {
    return this.getNameFromProduct(this.product);
  }

  // ---------------------------
  // image error handler used by template
  // ---------------------------
  onImgError(event: Event) {
    const img = event.target as HTMLImageElement;
    if (!img) return;
    img.src = '/assets/placeholder.png';
    img.onerror = null;
  }
}
