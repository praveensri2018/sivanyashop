// only show the changed/added parts and full class for clarity
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ProductService } from '../services/product.service';
import { finalize } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';

interface ProductRow {
  id: number;
  name: string;
  image: string;
  price?: number;       // displayed price (max by default or variant price)
  priceMax?: number;    // maximum price across variants
  priceMin?: number;    // minimum price
  stock?: number;       // total stock
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

  constructor(private productSvc: ProductService, private router: Router) {}

  ngOnInit(): void {
    this.loadProducts(true);
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

  openProduct(p: ProductRow) {
    this.router.navigate(['/product', p.id]).catch(err => console.warn('nav failed', err));
  }

  onSearchSubmit() {
    this.loadProducts(true);
  }

  // ---- NEW: select size (variant) handler ----
  selectSize(productId: number, variantId: number) {
    // toggle selection: if already selected, deselect
    const current = this.selectedVariantByProduct[productId] ?? null;
    if (current === variantId) {
      this.selectedVariantByProduct[productId] = null;
      // update displayed price back to max for that product
      const prod = this.products.find(x => x.id === productId);
      if (prod) prod.price = prod.priceMax;
      return;
    }
    this.selectedVariantByProduct[productId] = variantId;

    const prod = this.products.find(x => x.id === productId);
    if (!prod || !prod.sizes) return;

    const s = prod.sizes.find(sz => sz.variantId === variantId);
    if (s) {
      prod.price = s.price ?? prod.priceMax;
      prod.stock = s.stock ?? prod.stock;
    }
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
        // read price -- support multiple possible fields
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

        // label for size: prefer VariantName then Attributes or SKU
        let label = v?.VariantName ?? v?.variantName ?? '';
        if (!label) {
          const attrs = v?.Attributes ?? v?.attributes ?? '';
          label = attrs || (v?.SKU ?? v?.sku ?? '');
        }
        label = String(label).trim() || '—';

        if (variantId != null) {
          sizesArr.push({ label, variantId, price: priceNum ?? undefined, stock: st });
        }
      }
    }

    // default displayed price: maximum price if present, else min or undefined
    const displayPrice = maxPrice ?? minPrice ?? undefined;

    // ensure sizes sorted: put those with price first, descending price (optional)
    sizesArr.sort((a,b) => {
      const pa = a.price ?? -1;
      const pb = b.price ?? -1;
      return pb - pa;
    });

    // initialize selectedVariant as null
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
