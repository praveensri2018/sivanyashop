import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { AdminProductService } from '../services/admin-product.service';

@Component({
  selector: 'app-admin-product-upload',
  standalone: true,
  templateUrl: './product-upload.component.html',
  styleUrls: ['./product-upload.component.css'],
  imports: [CommonModule, ReactiveFormsModule]
})
export class ProductUploadComponent implements OnInit {
  productForm!: FormGroup;
  variantForm!: FormGroup;
  updateVariantForm!: FormGroup; // for updating existing variant price/stock
  categories: any[] = [];
  selectedFiles: File[] = [];
  createdProductId: number | null = null;
  uploadedImages: any[] = []; // store returned image info
  uploading = false;

  constructor(private fb: FormBuilder, private ps: AdminProductService) {}

  ngOnInit(): void {
    this.productForm = this.fb.group({ name: [''], description: [''], categoryIds: [[]] });
    this.variantForm = this.fb.group({ sku: [''], variantName: [''], attributes: [''], stockQty: [0], price: [0] });
    this.updateVariantForm = this.fb.group({ variantId: [''], price: [''], stockQty: [''] });
    this.loadCategories();
  }

  loadCategories() {
    this.ps.fetchCategories().subscribe({
      next: (res: any) => {
        const list = res?.categories ?? res?.data ?? (Array.isArray(res) ? res : []) ?? [];
        this.categories = list.map((c: any) => ({ id: c.Id ?? c.id, name: c.Name ?? c.name }));
      },
      error: () => (this.categories = [])
    });
  }

  createProduct() {
    const payload = this.productForm.value;
    this.ps.createProduct(payload).subscribe({
      next: (res: any) => {
        const p = res?.product ?? res;
        this.createdProductId = p?.Id ?? p?.id ?? res?.productId ?? null;
        alert(`✅ Product created (ID: ${this.createdProductId ?? 'unknown'})`);
      },
      error: err => alert(`❌ Create failed: ${err?.error?.message || err.message || 'Unknown'}`)
    });
  }

  onFilesSelected(ev: Event) {
    const input = ev.target as HTMLInputElement;
    if (!input.files) return;
    this.selectedFiles = Array.from(input.files);
  }

  uploadImages() {
    if (!this.createdProductId) return alert('Create product first!');
    if (this.selectedFiles.length === 0) return alert('Select images first');
    this.uploading = true;
    this.ps.uploadProductImages(this.createdProductId, this.selectedFiles).subscribe({
      next: (res: any) => {
        // assume backend returns array of image info or product with images
        this.uploadedImages = res?.images ?? res?.uploaded ?? res ?? [];
        this.uploading = false;
        alert('✅ Images uploaded');
      },
      error: err => {
        console.error(err);
        this.uploading = false;
        alert('❌ Upload failed: ' + (err?.error?.message || err.message || ''));
      }
    });
  }

  // Skip images and show variant area
  skipToVariants() {
    if (!this.createdProductId) {
      // allow skipping to variants by forcing createdProductId from form? keep simple:
      return alert('Create product first to add variants (or create then skip).');
    }
    // nothing else needed; UI shows variant form when createdProductId exists
  }

  addVariant() {
    if (!this.createdProductId) return alert('Create product first!');
    const payload = { ...this.variantForm.value, productId: this.createdProductId };
    this.ps.addVariant(payload).subscribe({
      next: (res: any) => alert('✅ Variant added'),
      error: (err) => alert('❌ Add variant failed: ' + (err?.error?.message || err.message || ''))
    });
  }

  updateVariant() {
    const vId = Number(this.updateVariantForm.value.variantId);
    if (!vId) return alert('Enter variantId to update');
    const price = Number(this.updateVariantForm.value.price || 0);
    const stockQty = this.updateVariantForm.value.stockQty;
    // example: update price then optionally stock (backend endpoints may vary)
    this.ps.updateVariantPrice?.(vId, 'CUSTOMER', price)?.subscribe?.({
      next: () => {
        // If your backend supports stock update, call that endpoint here; otherwise show success
        alert('✅ Variant price updated');
      },
      error: (err: any) => alert('❌ Update failed: ' + (err?.error?.message || err.message || ''))
    }) ?? alert('⚠️ No updateVariantPrice endpoint available on service.');
  }
}