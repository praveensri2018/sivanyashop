// src/app/admin/product-upload.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { AdminProductService } from '../services/admin-product.service';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';

interface VariantRow {
  id?: number | null;
  sku?: string;
  variantName?: string;
  attributes?: string;
  stockQty?: number;
  customerPrice?: number;
  retailerPrice?: number;
  imageIds?: number[];
}

@Component({
  selector: 'app-admin-product-upload',
  standalone: true,
  templateUrl: './product-upload.component.html',
  styleUrls: ['./product-upload.component.scss'],
  imports: [CommonModule, ReactiveFormsModule, FormsModule, NgSelectModule]
})
export class ProductUploadComponent implements OnInit {
  productForm!: FormGroup;
  variantForm!: FormGroup;
  updateVariantForm!: FormGroup;

  categories: Array<{ id: number | string; name: string }> = [];
  selectedFiles: Array<{ file: File; preview: string }> = [];
  uploadedImages: any[] = [];
  variants: VariantRow[] = [];

  createdProductId: number | null = null;
  isEditMode = false;

  uploading = false;
  processing = false;

  removedVariantIds: number[] = [];

  constructor(private fb: FormBuilder, private ps: AdminProductService,
  private route: ActivatedRoute,
  private router: Router) {}

  ngOnInit(): void {
    this.productForm = this.fb.group({
      name: [''],
      description: [''],
      categoryIds: [[]]
    });

    this.variantForm = this.fb.group({
      sku: [''],
      variantName: [''],
      attributes: [''],
      stockQty: [0],
      customerPrice: [0],
      retailerPrice: [0]
    });

    this.updateVariantForm = this.fb.group({
      variantId: [''],
      price: [''],
      stockQty: ['']
    });

    this.loadCategories();
    this.addVariantRow();

    this.route.queryParams.subscribe(params => {
  const id = params['id'];
  if (id) {
    this.loadProductById(id);
  }
});
  }

  goBack() {
  this.router.navigate(['/admin/products']);
}

  /* --------- categories --------- */
  loadCategories() {
    this.ps.fetchCategories().subscribe({
      next: (res: any) => {
        const list = res?.categories ?? res?.data ?? (Array.isArray(res) ? res : []) ?? [];
        this.categories = list.map((c: any) => ({ id: c.Id ?? c.id, name: c.Name ?? c.name }));
      },
      error: (err: any) => {
        console.error('fetchCategories error', err);
        this.categories = [];
      }
    });
  }

  /* --------- file previews --------- */
  onFilesSelected(ev: Event) {
    const input = ev.target as HTMLInputElement;
    if (!input.files) return;
    const files = Array.from(input.files);
    for (const file of files) {
      const reader = new FileReader();
      reader.onload = (e: any) => this.selectedFiles.push({ file, preview: e.target.result });
      reader.readAsDataURL(file);
    }
    input.value = '';
  }

  removePreview(index: number) {
    this.selectedFiles.splice(index, 1);
  }

  /* --------- variants UI --------- */
  addVariantRow(copy?: VariantRow) {
    const v: VariantRow = copy ? { ...copy } : { id: null, sku: '', variantName: '', attributes: '', stockQty: 0, customerPrice: 0, retailerPrice: 0, imageIds: [] };
    this.variants.push(v);
  }

  removeVariantRow(index: number) {
  const v = this.variants[index];
  if (v?.id) {
    this.removedVariantIds.push(v.id);
  }
  this.variants.splice(index, 1);
}

private deleteRemovedVariants(): Promise<void> {
  if (!this.removedVariantIds || this.removedVariantIds.length === 0) return Promise.resolve();

  console.log('Deleting/deactivating variants:', this.removedVariantIds);

  return new Promise((resolve) => {
    const ids = [...this.removedVariantIds];
    const seq = (i: number) => {
      if (i >= ids.length) {
        this.removedVariantIds = [];
        resolve();
        return;
      }
      const id = ids[i];

      if ((this.ps as any).deleteVariant) {
        (this.ps as any).deleteVariant(id).subscribe({
          next: () => {
            console.log(`✅ Deleted variant ${id}`);
            seq(i + 1);
          },
          error: (err: any) => {
            console.error('❌ deleteVariant error', err);
            if ((this.ps as any).deactivateVariant) {
              (this.ps as any).deactivateVariant(id).subscribe({
                next: () => {
                  console.log(`⚙️ Deactivated variant ${id}`);
                  seq(i + 1);
                },
                error: (err2: any) => {
                  console.error('❌ deactivateVariant error', err2);
                  seq(i + 1);
                }
              });
            } else {
              seq(i + 1);
            }
          }
        });
      } else if ((this.ps as any).deactivateVariant) {
        (this.ps as any).deactivateVariant(id).subscribe({
          next: () => {
            console.log(`⚙️ Deactivated variant ${id}`);
            seq(i + 1);
          },
          error: (err: any) => {
            console.error('❌ deactivateVariant error', err);
            seq(i + 1);
          }
        });
      } else {
        console.warn('No delete/deactivate API defined in service.');
        seq(i + 1);
      }
    };

    seq(0);
  });
}

  /* --------- helpers --------- */
  clearForm() {
    this.createdProductId = null;
    this.isEditMode = false;
    this.uploadedImages = [];
    this.selectedFiles = [];
    this.variants = [];
    try { this.productForm.reset(); } catch {}
    try { this.variantForm.reset(); } catch {}
    try { this.updateVariantForm.reset(); } catch {}
    this.addVariantRow();
  }

  private getFilesFromPreviews(): File[] {
    return this.selectedFiles.map(s => s.file);
  }

  private normalizeImagesResponse(res: any) {
    const raw = res?.images ?? res ?? [];
    const items = Array.isArray(raw) ? raw : [raw];
    const normalize = (it: any) => {
      if (!it) return null;
      const src = it.ImageUrl ?? it.imageUrl ?? it.url ?? it.path ?? it.src ?? null;
      const filename = it.filename ?? it.name ?? '';
      return { ...it, src, filename };
    };
    return items.map(normalize).filter(Boolean);
  }

  private uploadSelectedFilesToProduct(productId: number, files: File[]): Promise<any[]> {
    if (!files || files.length === 0) return Promise.resolve([]);
    this.uploading = true;
    return new Promise((resolve, reject) => {
      this.ps.uploadProductImages(productId, files).subscribe({
        next: (res: any) => {
          const normalized = this.normalizeImagesResponse(res);
          this.uploadedImages = (this.uploadedImages || []).concat(normalized);
          this.selectedFiles = [];
          this.uploading = false;
          resolve(normalized);
        },
        error: (err: any) => {
          this.uploading = false;
          console.error('uploadProductImages error', err);
          reject(err);
        }
      });
    });
  }

  /* --------- load product for edit --------- */
  loadProductById(productIdInput: string | number) {
    const id = Number(productIdInput);
    if (!id) return alert('Enter a valid product id');
    this.ps.fetchProduct(id).subscribe({
      next: (res: any) => {
        const product = res?.product ?? res;
        if (!product) return alert('Product not found');

        this.productForm.patchValue({
          name: product.Name ?? product.name ?? '',
          description: product.Description ?? product.description ?? '',
          categoryIds: product.CategoryIds ?? product.categoryIds ?? []
        });

        this.createdProductId = product.Id ?? product.id ?? null;
        this.isEditMode = !!this.createdProductId;

        const imgs = product.images ?? product.Images ?? res?.images ?? [];
        this.uploadedImages = this.normalizeImagesResponse(imgs);

        const serverVariants = product.variants ?? product.Variants ?? res?.variants ?? [];
        this.variants = (Array.isArray(serverVariants) ? serverVariants : []).map((sv: any) => {
          const pricesArr = sv.prices ?? sv.Prices ?? sv.variantPrices ?? [];
          const cust = pricesArr.find((p: any) => (p.PriceType ?? p.priceType) === 'CUSTOMER')?.Price
                     ?? sv.customerPrice ?? sv.customerPriceValue ?? 0;
          const ret = pricesArr.find((p: any) => (p.PriceType ?? p.priceType) === 'RETAILER')?.Price
                     ?? sv.retailerPrice ?? sv.retailerPriceValue ?? 0;
          return {
            id: sv.Id ?? sv.id ?? null,
            sku: sv.SKU ?? sv.sku ?? sv.Sku ?? '',
            variantName: sv.VariantName ?? sv.variantName ?? '',
            attributes: sv.Attributes ?? sv.attributes ?? '',
            stockQty: sv.StockQty ?? sv.stockQty ?? 0,
            customerPrice: cust,
            retailerPrice: ret,
            imageIds: sv.imageIds ?? sv.ImageIds ?? []
          } as VariantRow;
        });

        if (this.variants.length === 0) this.addVariantRow();
      },
      error: (err: any) => {
        console.error('fetchProduct error', err);
        alert('❌ Failed to load product: ' + (err?.error?.message || err.message || ''));
      }
    });
  }

  /* --------- final create/update flow --------- */
  async submitFinal() {
    const payload: any = { ...this.productForm.value };
    payload.categoryIds = (payload.categoryIds || []).map((v: any) => typeof v === 'string' && /^\d+$/.test(v) ? Number(v) : v);

    if (!payload.name) return alert('Enter product name');

    this.processing = true;

    try {
      let productId = this.createdProductId;

      if (!this.isEditMode) {
        const created: any = await this.callCreateProduct(payload);
        productId = created?.Id ?? created?.id ?? created?.productId ?? null;
        if (!productId) throw new Error('No product Id returned from create');
        this.createdProductId = productId;
        this.isEditMode = true;
      } else {
        await this.callUpdateProduct(this.createdProductId!, payload);
      }

      const files = this.getFilesFromPreviews();
      if (files.length > 0) {
        await this.uploadSelectedFilesToProduct(productId!, files);
      }

      await this.processAllVariants(productId!);
      await this.deleteRemovedVariants();
      
      this.processing = false;
      alert('✅ Product saved successfully.');
    } catch (err: any) {
      console.error('submitFinal error', err);
      this.processing = false;
      alert('❌ Save failed: ' + (err?.error?.message || err.message || ''));
    }
  }

  private callCreateProduct(payload: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.ps.createProduct(payload).subscribe({
        next: (res: any) => resolve(res?.product ?? res),
        error: (err: any) => { console.error('createProduct error', err); reject(err); }
      });
    });
  }

  private callUpdateProduct(productId: number, payload: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.ps.updateProduct(productId, payload).subscribe({
        next: (res: any) => resolve(res),
        error: (err: any) => { console.error('updateProduct error', err); reject(err); }
      });
    });
  }

  private processAllVariants(productId: number): Promise<void> {
  return new Promise((resolve) => {
    const seq = (i: number) => {
      if (i >= this.variants.length) { resolve(); return; }
      const v = this.variants[i];

      const isStockEmpty = v.stockQty === null || v.stockQty === undefined || Number.isNaN(Number(v.stockQty));
      const empty = (!v.sku || v.sku.toString().trim() === '') &&
                    (!v.variantName || v.variantName.toString().trim() === '') &&
                    (!v.customerPrice && v.customerPrice !== 0) &&
                    (!v.retailerPrice && v.retailerPrice !== 0) &&
                    isStockEmpty;

      if (empty) { seq(i + 1); return; }

      if (v.id) {
  const payloadForMeta = { // do NOT set stockQty here
    sku: v.sku,
    variantName: v.variantName,
    attributes: v.attributes,
    // no stockQty
  };

  // 1) Update metadata first (or after) — but do NOT set StockQty here
  // 2) Call the stock endpoint that will compute previousQty -> insert ledger -> update variant
  this.updateVariantStockLedger(v.id!, Number(v.stockQty || 0))
    .then(() => {
      // Now update other fields (meta/prices)
      if ((this.ps as any).updateVariant) {
        (this.ps as any).updateVariant(v.id, payloadForMeta).subscribe({
          next: () => this.setTwoPricesThenNext(v, seq, i),
          error: () => this.setTwoPricesThenNext(v, seq, i)
        });
      } else {
        this.setTwoPricesThenNext(v, seq, i);
      }
    })
    .catch(() => {
      // continue even on ledger failure
      if ((this.ps as any).updateVariant) {
        (this.ps as any).updateVariant(v.id, payloadForMeta).subscribe({
          next: () => this.setTwoPricesThenNext(v, seq, i),
          error: () => this.setTwoPricesThenNext(v, seq, i)
        });
      } else this.setTwoPricesThenNext(v, seq, i);
    });
}else {
        // ✅ UPDATED: Create new variant and update stock ledger
        const payload = { 
          productId, 
          sku: v.sku, 
          variantName: v.variantName, 
          attributes: v.attributes, 
          stockQty: Number(v.stockQty || 0) 
        };
        
        this.ps.addVariant(payload).subscribe({
          next: (resp: any) => {
            const variantCreated = resp?.variant ?? resp ?? {};
            v.id = variantCreated?.Id ?? variantCreated?.id ?? resp?.variantId ?? null;
            
            // ✅ Update stock ledger for new variant
            if (v.id) {
              this.updateVariantStockLedger(v.id, Number(v.stockQty || 0))
                .then(() => this.setTwoPricesThenNext(v, seq, i))
                .catch(() => this.setTwoPricesThenNext(v, seq, i));
            } else {
              this.setTwoPricesThenNext(v, seq, i);
            }
          },
          error: (err: any) => {
            console.error('addVariant create error', err);
            seq(i + 1);
          }
        });
      }
    };

    seq(0);
  });
}

  // ✅ NEW METHOD: Update variant stock and stock ledger
  private updateVariantStockLedger(variantId: number, stockQty: number): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ps.updateVariantStock(variantId, stockQty).subscribe({
        next: (res: any) => {
          console.log(`✅ Stock ledger updated for variant ${variantId}: ${stockQty}`);
          resolve();
        },
        error: (err: any) => {
          console.error('❌ updateVariantStock error', err);
          // Don't reject - continue with price setting even if stock update fails
          resolve();
        }
      });
    });
  }

  private setTwoPricesThenNext(v: VariantRow, seq: (n: number) => void, i: number) {
    const variantId = v.id;
    const cust = Number(v.customerPrice || 0);
    const ret = Number(v.retailerPrice || 0);

    const setCustomer = (cb: ()=>void) => {
      if (cust > 0 && variantId) {
        this.ps.setVariantPrice(variantId, 'CUSTOMER', cust).subscribe({ 
          next: () => cb(), 
          error: (e: any) => { console.error('set CUSTOMER price error', e); cb(); }
        });
      } else cb();
    };

    const setRetailer = (cb: ()=>void) => {
      if (ret > 0 && variantId) {
        this.ps.setVariantPrice(variantId, 'RETAILER', ret).subscribe({ 
          next: () => cb(), 
          error: (e: any) => { console.error('set RETAILER price error', e); cb(); }
        });
      } else cb();
    };

    setCustomer(() => setRetailer(() => seq(i + 1)));
  }

  /* --------- manual helpers --------- */
  async uploadImagesManual() {
    if (!this.createdProductId) return alert('Create or load a product first');
    try {
      const files = this.getFilesFromPreviews();
      await this.uploadSelectedFilesToProduct(this.createdProductId!, files);
      alert('✅ Images uploaded to product');
    } catch (err: any) {
      console.error('uploadImagesManual error', err);
      alert('❌ Upload failed');
    }
  }

  deleteImage(img: any) {
    if (!img?.Id) return alert('No image id');
    if (!confirm('Delete?')) return;
    const prev = [...this.uploadedImages];
    this.uploadedImages = this.uploadedImages.filter(i => i.Id !== img.Id);
    this.ps.deleteProductImage(img.Id).subscribe({
      next: () => {},
      error: (err: any) => { console.error('deleteProductImage error', err); this.uploadedImages = prev; alert('❌ Delete failed'); }
    });
  }

  // ✅ NEW METHOD: Bulk update stock for all variants
  bulkUpdateAllStock() {
    const stockUpdates = this.variants
      .filter(v => v.id && v.stockQty !== undefined && v.stockQty !== null)
      .map(v => ({ variantId: v.id!, stockQty: Number(v.stockQty || 0) }));

    if (stockUpdates.length === 0) {
      alert('No variants with stock to update');
      return;
    }

    this.ps.bulkUpdateStock(stockUpdates).subscribe({
      next: (res: any) => {
        console.log('✅ Bulk stock update successful:', res);
        alert(`✅ Updated stock for ${stockUpdates.length} variants`);
      },
      error: (err: any) => {
        console.error('❌ Bulk stock update failed:', err);
        alert('❌ Bulk stock update failed');
      }
    });
  }
}