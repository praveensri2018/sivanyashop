// ✅ FILE: src/app/shop/shop.component.ts
// Handles search, pagination, and variant selection.

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { ProductService } from '../services/product.service';
import { finalize } from 'rxjs/operators';

interface ShopCard {
  id: number | string;
  name: string;
  description?: string;
  imagePath?: string;
  sizes?: Array<{ label: string; variantId: number | string; price?: number; stock?: number }>;
  priceMax?: number;
  priceMin?: number;
  displayPrice?: number;
}

@Component({
  selector: 'app-shop',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './shop.component.html',
  styleUrls: ['./shop.component.scss']
})
export class ShopComponent implements OnInit {
  products: ShopCard[] = [];
  selectedVariantByProduct: Record<number | string, number | string | null> = {};

  loading = false;
  page = 1;
  limit = 12;
  total = 0;

  searchTerm = '';

  constructor(
    private svc: ProductService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // 🔹 Watch for ?q= search query param from header
    this.route.queryParams.subscribe(params => {
      const query = (params['q'] || '').trim();
      this.searchTerm = query;
      this.loadProducts(1, true, query);
    });
  }

  /**
   * Fetch products depending on user role and search term
   */
  loadProducts(page = 1, reset = false, search: string = '') {
    if (this.loading) return;

    if (reset) {
      this.products = [];
      this.selectedVariantByProduct = {};
      this.page = 1;
    }

    this.loading = true;

    // 🔹 Call ProductService with page, limit, and search
    this.svc
      .fetchProducts(page, this.limit, search)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res: any) => {
          const rawItems: any[] = Array.isArray(res)
            ? res
            : res?.items ?? [];

          const mapped = rawItems.map((r: any) => this.normalizeToCard(r));

          if (page > 1 && !reset) {
            this.products = this.products.concat(mapped);
          } else {
            this.products = mapped;
          }

          this.total = Number(res?.total ?? this.total ?? this.products.length);
          this.page = Number(res?.page ?? page);
          this.limit = Number(res?.limit ?? this.limit);
        },
        error: (err) => {
          console.error('❌ Failed to load products', err);
        }
      });
  }

  /**
   * Normalize backend product object to frontend-friendly card
   */
  private normalizeToCard(p: any): ShopCard {
    const id = p?.ProductId ?? p?.Id ?? p?.id;
    const name = p?.ProductName ?? p?.Name ?? p?.name ?? 'Product';
    const description = p?.Description ?? p?.description ?? '';

    let imagePath: string | undefined = p?.ImagePath ?? p?.imagePath ?? p?.image;

    if (!imagePath) {
      const imgs = p?.ImageUrls ?? p?.images ?? p?.Images ?? [];
      if (Array.isArray(imgs) && imgs.length) {
        const first = imgs[0];
        imagePath = typeof first === 'string' ? first : (first?.ImageUrl ?? first?.imageUrl ?? first?.url);
      }
    }

    const variants = Array.isArray(p?.variants)
      ? p.variants
      : Array.isArray(p?.Variants)
      ? p.Variants
      : [];

    let maxPrice: number | undefined;
    let minPrice: number | undefined;

    const sizes: Array<{ label: string; variantId: number | string; price?: number; stock?: number }> = [];

    for (const v of variants) {
      const variantId = v?.Id ?? v?.id ?? v?.VariantId ?? null;
      const rawPrice = v?.price ?? v?.Price ?? null;
      const priceNum =
        rawPrice != null && !isNaN(Number(rawPrice)) ? Number(rawPrice) : undefined;

      if (priceNum !== undefined) {
        maxPrice =
          maxPrice === undefined ? priceNum : Math.max(maxPrice, priceNum);
        minPrice =
          minPrice === undefined ? priceNum : Math.min(minPrice, priceNum);
      }

      const stock = Number(v?.StockQty ?? v?.stockQty ?? v?.stock ?? 0) || 0;
      const label =
        v?.VariantName ??
        v?.Variant ??
        v?.Attributes ??
        v?.SKU ??
        String(variantId ?? '—');

      if (variantId != null) {
        sizes.push({
          label: String(label).trim() || '—',
          variantId,
          price: priceNum,
          stock
        });
      }
    }

    sizes.sort((a, b) => {
      const pa = a.price ?? -1;
      const pb = b.price ?? -1;
      if (pb - pa !== 0) return pb - pa;
      return a.label.localeCompare(b.label);
    });

    const displayPrice =
      maxPrice !== undefined ? maxPrice : minPrice;

    this.selectedVariantByProduct[id] =
      this.selectedVariantByProduct[id] ?? null;

    return {
      id,
      name,
      description,
      imagePath,
      sizes,
      priceMax: maxPrice,
      priceMin: minPrice,
      displayPrice
    };
  }

  // 🔹 Handle size selection
  selectSize(productId: number | string, variantId: number | string, event?: Event) {
    if (event) event.stopPropagation();

    const current = this.selectedVariantByProduct[productId] ?? null;
    if (current === variantId) {
      this.selectedVariantByProduct[productId] = null;
      const prod = this.products.find(x => x.id === productId);
      if (prod) prod.displayPrice = prod.priceMax ?? prod.priceMin;
      return;
    }

    this.selectedVariantByProduct[productId] = variantId;

    const prod = this.products.find(x => x.id === productId);
    if (!prod || !prod.sizes) return;

    const s = prod.sizes.find(sz => sz.variantId === variantId);
    if (s) {
      prod.displayPrice =
        s.price !== undefined ? s.price : prod.priceMax ?? prod.priceMin;
    }
  }

  isSizeSelected(productId: number | string, variantId: number | string): boolean {
    return this.selectedVariantByProduct[productId] === variantId;
  }

  // 🔹 Load more pagination
  loadMore() {
    if (this.loading) return;
    if (this.total && this.products.length >= this.total) return;
    this.page += 1;
    this.loadProducts(this.page, false, this.searchTerm);
  }

  // 🔹 Handle image fallback
  onImgError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.src = '/assets/no-image.jpg';
    img.onerror = null;
  }

  trackById = (_: number, p: ShopCard) => p?.id ?? _;
}
