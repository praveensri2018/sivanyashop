// FILE: src/app/admin/product-list.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminProductService } from '../services/admin-product.service';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';

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
  limit = 10; // 🔹 show 10 products per page
  total = 0;
  totalPages = 1;
  placeholderImage = '/assets/no-image.jpg';

  constructor(private ps: AdminProductService, private fb: FormBuilder, private router: Router) {}

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

  // 🔹 Pagination helpers
  nextPage() {
    if (this.page < this.totalPages) {
      this.page++;
      this.loadProducts();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  prevPage() {
    if (this.page > 1) {
      this.page--;
      this.loadProducts();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  // 🔹 Load products from API
  loadProducts() {
    this.loading = true;
    this.ps.fetchProducts(this.page, this.limit).subscribe({
      next: (res: any) => {
        console.log('📦 fetchProducts result', res);
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

        this.total = Number(res?.total ?? list.length ?? 0);
        this.totalPages = Math.ceil(this.total / this.limit) || 1;
        this.loading = false;
      },
      error: (err) => {
        console.error('❌ fetchProducts error', err);
        this.loading = false;
      }
    });
  }

  editProduct(productId: number) {
    if (!productId) return;
    this.router.navigate(['/admin/product-upload'], { queryParams: { id: productId } });
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
      const raw = p?.raw ?? p;
      const imageUrls = raw?.ImageUrls ?? raw?.imageUrls ?? p?.ImageUrls ?? null;
      if (Array.isArray(imageUrls) && imageUrls.length > 0) {
        const url = String(imageUrls[0]);
        return this.ensureAbsolute(url);
      }

      const imgPath = raw?.ImagePath ?? raw?.imagePath ?? p?.imagePath;
      if (imgPath && String(imgPath).trim().toLowerCase().startsWith('http')) {
        return String(imgPath);
      }

      return this.placeholderImage;
    } catch {
      return this.placeholderImage;
    }
  }

  ensureAbsolute(url: string): string {
    if (!url) return this.placeholderImage;
    url = String(url);
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${window.location.origin}${url.startsWith('/') ? '' : '/'}${url}`;
  }

  onImgError(event: Event) {
    const el = event.target as HTMLImageElement;
    el.src = this.placeholderImage;
  }
}
