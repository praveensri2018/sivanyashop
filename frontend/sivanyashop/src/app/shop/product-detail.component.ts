// Replace your existing ProductDetailComponent with this file content
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { ProductService } from '../services/product.service';
import { Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CartService } from '../services/cart.service';
import { AuthService } from '../auth/auth.service';

import { SizeChartComponent } from '../customer/size-chart/size-chart.component';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SizeChartComponent],
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
  
  // Add productId property
  productId!: number;

  constructor(
    private route: ActivatedRoute,
    private svc: ProductService,
    private location: Location,
    private router: Router,
    private cart: CartService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    // where to place: decode route param here, before calling loadProduct
    const idParam = this.route.snapshot.paramMap.get('id');
    const decoded = this.decodeId(idParam); // <-- decode the encoded id (method below)
    if (decoded !== null) {
      this.productId = decoded;
      // loadProduct expects a string id for the service; pass numeric as string
      this.loadProduct(String(decoded));
    } else if (idParam) {
      // fallback: try to load using raw param
      this.productId = Number(idParam) || 0;
      this.loadProduct(idParam);
    } else {
      // no id - keep product null
      this.productId = 0;
    }
  }

  // -----------------------
  // ID decode helper
  // -----------------------
  // Place this helper inside the component class (exactly here).
  // Mirrors the encoding used when navigating: base64 of "p:<id>"
  private decodeId(encoded: string | null | undefined): number | null {
    if (encoded == null) return null;
    // numeric case (not encoded)
    if (/^\d+$/.test(encoded)) return Number(encoded);
    try {
      const decoded = atob(encoded);
      if (decoded && decoded.startsWith('p:')) {
        const num = decoded.slice(2);
        if (/^\d+$/.test(num)) return Number(num);
      }
    } catch {
      // ignore if not base64
    }
    // final fallback
    const parsed = parseInt(encoded as string, 10);
    return Number.isFinite(parsed) ? parsed : null;
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
          // Find first available variant with stock
          const availableVariant = variants.find(v => this.getVariantStockQty(v) > 0);
          const first = availableVariant || variants[0];
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

  // NEW: Helper method to get variant stock quantity
  private getVariantStockQty(variant: any): number {
    return variant?.StockQty ?? variant?.stockQty ?? variant?.stock ?? variant?.Stock ?? 0;
  }

  // NEW: Check if selected variant has sufficient stock
  private hasSufficientStock(): boolean {
    if (!this.selectedVariant) return false;
    
    const availableStock = this.getVariantStockQty(this.selectedVariant);
    return availableStock >= this.quantity && availableStock > 0;
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

  // UPDATED: Add stock validation to canAddToCart
  canAddToCart(): boolean {
    const hasVariants = (this.getVariantsFromProduct(this.product) || []).length > 0;
    if (hasVariants && !this.selectedVariantId) return false;
    if (!this.hasSufficientStock()) return false;
    return this.product != null && this.quantity > 0;
  }

  // UPDATED: Add stock validation before adding to cart
  addToCart() {
    // Validate stock first
    if (!this.hasSufficientStock()) {
      const availableStock = this.getVariantStockQty(this.selectedVariant);
      if (availableStock <= 0) {
        alert('❌ This item is out of stock');
      } else {
        alert(`❌ Only ${availableStock} items available in stock`);
      }
      return;
    }

    // If user not logged in -> navigate to login (do not add to cart)
    const token = this.auth.getToken ? this.auth.getToken() : null;
    const isLoggedIn = !!token;

    if (!isLoggedIn) {
      const pid = this.getIdFromProduct(this.product);
      const queryParams: any = { redirect: `/product/${pid}` };
      if (this.selectedVariantId) queryParams.variant = String(this.selectedVariantId);
      if (this.quantity) queryParams.qty = String(this.quantity || 1);

      this.router.navigate(['/login'], { queryParams }).catch(err => console.warn('nav to login failed', err));
      return;
    }

    // Logged in -> proceed to add to cart as before
    if (!this.canAddToCart()) { 
      alert('Select a valid variant and quantity'); 
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

  onImgError(event: Event) {
    const img = event.target as HTMLImageElement;
    if (!img) return;
    img.src = '/assets/placeholder.png';
    img.onerror = null;
  }
}
