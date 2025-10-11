// FILE: src/app/admin/product-list.component.ts
// Place at: src/app/admin/product-list.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminProductService } from '../services/admin-product.service';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-product-list',
  standalone: true,
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss'],
  imports: [CommonModule, RouterModule, ReactiveFormsModule]
})
export class ProductListComponent implements OnInit {
  products: any[] = [];
  loading = false;
  editingId: number | null = null;
  editForm!: FormGroup;
  page = 1;
  limit = 100;
placeholderImage = '/assets/no-image.jpg'; 

  constructor(private ps: AdminProductService, private fb: FormBuilder,
  private router: Router) {}

  ngOnInit(): void {
    this.loadProducts();
    this.editForm = this.fb.group({
      name: [''],
      description: [''],
      imagePath: [''],
      categoryIds: [[]],
      isActive: [true]
    });
  }

  editProduct(productId: number) {
  if (!productId) return;
  this.router.navigate(['/admin/product-upload'], { queryParams: { id: productId } });
}

  loadProducts() {
  this.loading = true;
  this.ps.fetchProducts(this.page, this.limit).subscribe({
    next: (res: any) => {
        console.log(res);
      // backend returns { success: true, products: [...], total, page, limit }
      const list = res?.products ?? res?.data ?? (Array.isArray(res) ? res : []);
      this.products = (list || []).map((p: any) => ({
        id: p?.ProductId ?? p?.Id ?? p?.id,
        name: p?.ProductName ?? p?.Name ?? p?.name,
        description: p?.Description ?? p?.description,
        imagePath: p?.ImagePath ?? p?.imagePath ?? p?.image ?? '',
        categoryIds: p?.CategoryIds ?? p?.categoryIds ?? [],
        isActive: p?.IsActive ?? p?.isActive ?? true,
        raw: p
      }));
      this.loading = false;
    },
    error: (err) => {
      console.error('fetchProducts error', err);
      this.loading = false;
    }
  });
}

  startEdit(prod: any) {
    this.editingId = prod.id;
    this.editForm.patchValue({
      name: prod.name,
      description: prod.description,
      imagePath: prod.imagePath,
      categoryIds: prod.categoryIds || [],
      isActive: prod.isActive
    });
  }

  cancelEdit() {
    this.editingId = null;
    this.editForm.reset();
  }

  saveEdit(productId: number) {
  const v = this.editForm.value;
  // Map UI form values to backend field names
  const payload = {
    ProductName: v.name,
    Description: v.description,
    ImagePath: v.imagePath,
    CategoryIds: v.categoryIds || [],
    IsActive: v.isActive
  };

  this.ps.updateProduct(productId, payload).subscribe({
    next: () => {
      alert('✅ Product updated');
      this.editingId = null;
      this.loadProducts();
    },
    error: (err) => {
      console.error('updateProduct error', err);
      alert('❌ Update failed: ' + (err?.error?.message || err.message || 'Unknown'));
    }
  });
}


  confirmDelete(productId: number) {
    if (!confirm('Delete this product?')) return;
    this.ps.deleteProduct(productId).subscribe({
      next: () => {
        alert('✅ Deleted');
        this.loadProducts();
      },
      error: (err) => {
        console.error('deleteProduct error', err);
        alert('❌ Delete failed: ' + (err?.error?.message || err.message || 'Unknown'));
      }
    });
  }

  toggleActive(prod: any) {
  const newState = !prod.isActive;
  // Send minimal payload expected by backend
  const payload = { IsActive: newState };

  this.ps.updateProduct(prod.id, payload).subscribe({
    next: () => {
      prod.isActive = newState;
    },
    error: (err) => {
      console.error('toggleActive error', err);
      alert('❌ Toggle failed: ' + (err?.error?.message || err.message || 'Unknown'));
    }
  });
}



getImage(p: any): string {
  try {
    // prefer backend-provided array of URLs
    const raw = p?.raw ?? p;
    const imageUrls = raw?.ImageUrls ?? raw?.imageUrls ?? p?.ImageUrls ?? null;
    if (Array.isArray(imageUrls) && imageUrls.length > 0) {
      const url = String(imageUrls[0]);
      console.log('[IMG] using ImageUrls[0] for', p.id ?? raw?.ProductId, url);
      return this.ensureAbsolute(url);
    }

    // try ImagePath (could be 'cloudflare' or partial) — only accept if looks like URL
    const imgPath = raw?.ImagePath ?? raw?.imagePath ?? p?.imagePath;
    if (imgPath && String(imgPath).trim().toLowerCase().startsWith('http')) {
      console.log('[IMG] using ImagePath for', p.id ?? raw?.ProductId, imgPath);
      return String(imgPath);
    }

    // sometimes backend stores full URLs in ImageUrls property (already handled), else fallback placeholder
    console.warn('[IMG] no usable image for', p.id ?? raw?.ProductId, 'falling back to placeholder');
    return this.placeholderImage;
  } catch (err) {
    console.error('[IMG] getImage error', err);
    return this.placeholderImage;
  }
}

/** Make sure url is absolute. If server returns relative path, convert using api base (if needed) */
ensureAbsolute(url: string): string {
  if (!url) return this.placeholderImage;
  url = String(url);
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  // If backend returns relative path like "/images/..." prepend API base (AppConfig), adjust path as needed.
  // import AppConfig if required or hardcode base. Example using window.location.origin:
  return `${window.location.origin}${url.startsWith('/') ? '' : '/'}${url}`;
}

/** Image onerror handler: replace broken image with placeholder */
onImgError(event: Event) {
  const el = event.target as HTMLImageElement;
  el.src = this.placeholderImage;
}


}
