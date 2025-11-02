// Replace your existing CustomerProductsComponent with this file content
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ProductService } from '../services/product.service';
import { finalize } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router'; 

interface ProductRow {
  id: number;
  name: string;
  image: string;
  price?: number;
  priceMax?: number;
  priceMin?: number;
  stock?: number;
  sizes?: Array<{ label: string; variantId: number; price?: number; stock?: number }>;
  raw?: any;
}

@Component({
  selector: 'app-customer-products',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './customer-products.component.html',
  styleUrls: ['./customer-products.component.scss']
})
export class CustomerProductsComponent implements OnInit {
  products: ProductRow[] = [];
  loading = false;

  // pagination state
  page = 1;
  limit = 12;
  total = 0;
  pages: number[] = [];

  // search
  searchQuery = '';

  // store selected variant per product (productId -> variantId)
  selectedVariantByProduct: Record<number, number | null> = {};

  constructor(private productSvc: ProductService, private router: Router,
  private route: ActivatedRoute) {}

ngOnInit(): void {
  // Listen for search query parameters
  this.route.queryParams.subscribe(params => {
    this.searchQuery = params['search'] || '';
    this.loadProducts(true);
  });
}

  loadProducts(reset = false) {
    if (this.loading) return;
    if (reset) {
      this.page = 1;
      this.products = [];
      this.selectedVariantByProduct = {};
    }
    this.loading = true;
    this.productSvc.fetchProducts(this.page, this.limit, this.searchQuery)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res) => {
          this.total = res.total ?? 0;
          this.page = res.page ?? this.page;
          this.limit = res.limit ?? this.limit;
          this.pages = this.createPageArray(this.total, this.limit);
          const mapped = (res.items || []).map((p: any) => this.mapProduct(p));
          if (reset) this.products = mapped; else this.products = this.products.concat(mapped);
        },
        error: (err) => {
          console.error('loadProducts error', err);
        }
      });
  }

  loadPage(p: number) {
    if (p < 1) return;
    if (p === this.page) return;
    this.page = p;
    this.products = [];
    this.loadProducts(false);
  }

  next() {
    if (this.page < this.pages.length) {
      this.page++;
      this.products = [];
      this.loadProducts(false);
    }
  }
  prev() {
    if (this.page > 1) {
      this.page--;
      this.products = [];
      this.loadProducts(false);
    }
  }

  private createPageArray(total: number, limit: number): number[] {
    const count = Math.max(0, Math.ceil((Number(total) || 0) / Number(limit || 1)));
    const arr = [];
    for (let i = 1; i <= count; i++) arr.push(i);
    return arr;
  }

  // -----------------------
  // ID encoding helpers
  // -----------------------
  // Place these helper methods inside this component (they are used when navigating).
  // Encoding: base64 of "p:<id>" to avoid ambiguous decode (keeps it reversible).
  private encodeId(id: number): string {
    // where to place: put this method inside the component class (exactly here)
    try {
      return btoa(`p:${id}`);
    } catch {
      // fallback: simple numeric string if btoa unavailable or fails
      return String(id);
    }
  }

  private decodeId(encoded: string | null | undefined): number | null {
    // where to place: put this method inside the component class (exactly here)
    if (encoded == null) return null;
    // if it's numeric already, return numeric
    if (/^\d+$/.test(encoded)) return Number(encoded);
    try {
      const decoded = atob(encoded);
      if (decoded && decoded.startsWith('p:')) {
        const num = decoded.slice(2);
        if (/^\d+$/.test(num)) return Number(num);
      }
    } catch {
      // ignore decode error
    }
    // final fallback: try parse int
    const parsed = parseInt(encoded as string, 10);
    return Number.isFinite(parsed) ? parsed : null;
  }

  // -----------------------
  // Navigation (encode id before navigating)
  // -----------------------

  openProduct(p: ProductRow) {
    // where to place: this replaces the original openProduct implementation
    // encode numeric id before routing so route contains encoded id
    const encoded = this.encodeId(p.id); // <-- encoded id (place comment here)
    this.router.navigate(['/product', encoded]).catch(err => console.warn('nav failed', err));
  }

  onSearchSubmit() {
    this.loadProducts(true);
  }

  // ---- NEW: select size (variant) handler ----
  selectSize(productId: number, variantId: number) {
    // where to place: this replaces original selectSize navigation call
    // We still track selectedVariantByProduct locally (so isSizeSelected works), but for full product page
    // we navigate to the product route using encoded id + variant query param.
    this.selectedVariantByProduct[productId] = variantId; // keep UI selection locally

    const encoded = this.encodeId(productId); // <-- encode here
    this.router.navigate(['/product', encoded], { queryParams: { variant: variantId } })
      .catch(err => console.warn('navigate to product failed', err));
  }

  // helper to check selected state in template
  isSizeSelected(productId: number, variantId: number): boolean {
    return (this.selectedVariantByProduct[productId] ?? null) === variantId;
  }

  // ---- mapping: compute min/max price, sizes with price & stock ----
  private mapProduct(p: any): ProductRow {
    const id = p?.ProductId ?? p?.Id ?? p?.id;
    const name = p?.ProductName ?? p?.Name ?? p?.name ?? 'Product';
    const image = this.pickImage(p);
    const variants = p?.variants ?? p?.Variants ?? p?.productVariants ?? [];

    let maxPrice: number | null = null;
    let minPrice: number | null = null;
    let totalStock = 0;
    const sizesArr: Array<{ label: string; variantId: number; price?: number; stock?: number }> = [];

    if (Array.isArray(variants)) {
      for (const v of variants) {
        const variantId = v?.Id ?? v?.id ?? null;
        let price = v?.price ?? v?.Price ?? v?.customerPrice ?? v?.CustomerPrice ?? null;
        if (price == null) {
          const prices = v?.prices ?? v?.Prices ?? [];
          if (Array.isArray(prices) && prices.length) {
            const cp = prices.find((x:any) => (x.PriceType ?? x.priceType) === 'CUSTOMER');
            price = cp?.Price ?? cp?.price ?? null;
          }
        }
        const priceNum = price != null && !isNaN(Number(price)) ? Number(price) : null;
        if (priceNum !== null) {
          if (maxPrice === null || priceNum > maxPrice) maxPrice = priceNum;
          if (minPrice === null || priceNum < minPrice) minPrice = priceNum;
        }

        const st = Number(v?.StockQty ?? v?.stockQty ?? v?.stock ?? 0) || 0;
        totalStock += st;

        let label = v?.Attributes ?? v?.variantName ?? '';
        if (!label) {
          const attrs = v?.VariantName ?? v?.attributes ?? '';
          label = attrs || (v?.SKU ?? v?.sku ?? '');
        }
        label = String(label).trim() || '—';

        if (variantId != null) {
          sizesArr.push({ label, variantId, price: priceNum ?? undefined, stock: st });
        }
      }
    }

    const displayPrice = maxPrice ?? minPrice ?? undefined;

    sizesArr.sort((a,b) => {
      const pa = a.price ?? -1;
      const pb = b.price ?? -1;
      return pb - pa;
    });

    this.selectedVariantByProduct[id] = this.selectedVariantByProduct[id] ?? null;

    return {
      id,
      name,
      image,
      price: displayPrice,
      priceMax: maxPrice ?? undefined,
      priceMin: minPrice ?? undefined,
      stock: totalStock,
      sizes: sizesArr,
      raw: p
    };
  }

  private pickImage(p: any): string {
    const imgs = p?.images ?? p?.Images ?? p?.ImageUrls ?? p?.imagesList ?? [];
    if (Array.isArray(imgs) && imgs.length) {
      const first = imgs[0];
      if (typeof first === 'string') return first;
      return first?.ImageUrl ?? first?.imageUrl ?? first?.url ?? '/assets/no-image.jpg';
    }
    const path = p?.ImagePath ?? p?.imagePath ?? p?.image ?? null;
    if (path && typeof path === 'string') return path;
    return '/assets/no-image.jpg';
  }

  public onImgError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.src = '/assets/no-image.jpg';
    img.onerror = null;
  }
}
