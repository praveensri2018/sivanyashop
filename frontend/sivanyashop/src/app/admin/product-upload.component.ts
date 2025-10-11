// FILE: src/app/admin/product-upload.component.ts
import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { AdminProductService } from '../services/admin-product.service';

declare const $: any; // use global jQuery loaded via angular.json scripts

@Component({
  selector: 'app-admin-product-upload',
  standalone: true,
  templateUrl: './product-upload.component.html',
  styleUrls: ['./product-upload.component.scss'],
  imports: [CommonModule, ReactiveFormsModule]
})
export class ProductUploadComponent implements OnInit, AfterViewInit, OnDestroy {
  productForm!: FormGroup;
  variantForm!: FormGroup;
  updateVariantForm!: FormGroup;
  categories: any[] = [];
  selectedFiles: File[] = [];
  createdProductId: number | null = null;
  uploadedImages: any[] = [];
  uploading = false;

  private select2Initialized = false;
  private $selectEl: any = null;
  private initAttempts = 0;

  constructor(private fb: FormBuilder, private ps: AdminProductService) {}

  ngOnInit(): void {
    this.productForm = this.fb.group({ name: [''], description: [''], categoryIds: [[]] });
    this.variantForm = this.fb.group({ sku: [''], variantName: [''], attributes: [''], stockQty: [0], price: [0] });
    this.updateVariantForm = this.fb.group({ variantId: [''], price: [''], stockQty: [''] });
    this.loadCategories();
  }

  ngAfterViewInit(): void {
    // Try to initialize Select2 once the view is ready. If scripts not loaded yet, retry a few times.
    setTimeout(() => this.tryInitSelect2WithRetry(), 0);
  }

  ngOnDestroy(): void {
    this.destroySelect2();
  }

  loadCategories() {
    this.ps.fetchCategories().subscribe({
      next: (res: any) => {
        const list = res?.categories ?? res?.data ?? (Array.isArray(res) ? res : []) ?? [];
        this.categories = list.map((c: any) => ({ id: c.Id ?? c.id, name: c.Name ?? c.name }));
        // let DOM update then try to init/refresh select2
        setTimeout(() => this.tryInitSelect2WithRetry(), 0);
      },
      error: () => {
        this.categories = [];
        setTimeout(() => this.destroySelect2(), 0);
      }
    });
  }

  // Robust retry wrapper: tries up to 8 times (short interval) to initialize Select2
  private tryInitSelect2WithRetry() {
    this.initAttempts++;
    try {
      this.initOrRefreshSelect2();
    } catch (err) {
      // if Select2 not ready, retry a few times
      if (this.initAttempts < 8) {
        setTimeout(() => this.tryInitSelect2WithRetry(), 200);
      } else {
        console.warn('Select2 failed to initialize after retries:', err);
      }
    }
  }

  private initOrRefreshSelect2() {
    // get element
    this.$selectEl = $('#categorySelect');
    if (!this.$selectEl || this.$selectEl.length === 0) {
      throw new Error('select element #categorySelect not found in DOM');
    }

    // destroy if already initialized
    if (this.select2Initialized) {
      this.destroySelect2();
    }

    // require Select2 available on $ (global)
    if (!this.$selectEl.select2 || typeof this.$selectEl.select2 !== 'function') {
      throw new Error('Select2 is not loaded (select2 function missing).');
    }

    // init select2
    this.$selectEl.select2({
      placeholder: 'Select categories',
      width: 'resolve',
      allowClear: true,
      closeOnSelect: false,
      dropdownParent: this.$selectEl.parent()
    });

    // set initial value from form if exists
    const currentVal = this.productForm.get('categoryIds')?.value || [];
    if (currentVal && currentVal.length) {
      this.$selectEl.val(currentVal.map((v: any) => String(v))).trigger('change');
    }

    // sync changes to Angular form
    this.$selectEl.on('change.select2', () => {
      const val = this.$selectEl.val() || [];
      const parsed = (val || []).map((v: any) => {
        if (typeof v === 'string' && /^\d+$/.test(v)) return Number(v);
        return v;
      });
      this.productForm.get('categoryIds')?.setValue(parsed);
    });

    this.select2Initialized = true;
    this.initAttempts = 0;
    console.info('Select2 initialized on #categorySelect');
  }

  private destroySelect2() {
    try {
      if (this.$selectEl && this.$selectEl.length && this.select2Initialized) {
        this.$selectEl.off('.select2');
        try { this.$selectEl.select2('destroy'); } catch (err) {}
      }
    } finally {
      this.select2Initialized = false;
      this.$selectEl = null;
    }
  }

  /* ---------- rest of your methods unchanged ---------- */
  createProduct() { /* same as your existing method */ this._createProduct(); }
  private _createProduct() {
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

  uploadImages() { /* same as existing */ 
    if (!this.createdProductId) return alert('Create product first!');
    if (this.selectedFiles.length === 0) return alert('Select images first');
    this.uploading = true;
    this.ps.uploadProductImages(this.createdProductId, this.selectedFiles).subscribe({
      next: (res: any) => {
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

  skipToVariants() { if (!this.createdProductId) return alert('Create product first to add variants (or create then skip).'); }

  addVariant() {
    if (!this.createdProductId) return alert('Create product first!');
    const payload = { ...this.variantForm.value, productId: this.createdProductId };
    this.ps.addVariant(payload).subscribe({
      next: () => alert('✅ Variant added'),
      error: (err) => alert('❌ Add variant failed: ' + (err?.error?.message || err.message || ''))
    });
  }

  updateVariant() {
    const vId = Number(this.updateVariantForm.value.variantId);
    if (!vId) return alert('Enter variantId to update');
    const price = Number(this.updateVariantForm.value.price || 0);
    this.ps.updateVariantPrice?.(vId, 'CUSTOMER', price)?.subscribe?.({
      next: () => alert('✅ Variant price updated'),
      error: (err: any) => alert('❌ Update failed: ' + (err?.error?.message || err.message || ''))
    }) ?? alert('⚠️ No updateVariantPrice endpoint available on service.');
  }
}
