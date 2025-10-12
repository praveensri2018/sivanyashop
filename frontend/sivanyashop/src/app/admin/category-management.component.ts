// FILE: src/app/admin/category-management.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { AdminProductService } from '../services/admin-product.service';

@Component({
  selector: 'app-admin-category-management',
  standalone: true,
  templateUrl: './category-management.component.html',
  styleUrls: ['./category-management.component.scss'],
  imports: [CommonModule, ReactiveFormsModule]
})
export class CategoryManagementComponent implements OnInit {
  form!: FormGroup;
  categories: any[] = [];
  loading = false;
  editingId: number | null = null; // <-- for update mode

  constructor(private fb: FormBuilder, private ps: AdminProductService) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      name: [''],
      parentCategoryId: [null]
    });
    this.loadCategories();
  }

  loadCategories() {
    this.loading = true;
    this.ps.fetchCategories().subscribe({
      next: (res: any) => {
        const list =
          res?.categories ??
          res?.data ??
          (Array.isArray(res) ? res : []) ??
          [];

        this.categories = list.map((c: any) => ({
          id: c.Id ?? c.id,
          name: c.Name ?? c.name,
          parentCategoryId: c.ParentCategoryId ?? c.parentCategoryId ?? null,
        }));
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load categories', err);
        this.loading = false;
      }
    });
  }

  createCategory() {
    const payload = this.form.value;
    if (!payload.name || payload.name.trim() === '') {
      return alert('Please enter category name');
    }

    // 🔄 If editing, update instead
    if (this.editingId) {
      this.updateCategory();
      return;
    }

    this.ps.createCategory(payload).subscribe({
      next: () => {
        alert('✅ Category created');
        this.form.reset({ name: '', parentCategoryId: null });
        this.loadCategories();
      },
      error: (err) => {
        console.error('Create category failed', err);
        alert('❌ Create failed: ' + (err?.error?.message ?? err?.message ?? ''));
      }
    });
  }

  // 🟢 Start editing a category
  editCategory(cat: any) {
    this.editingId = cat.id;
    this.form.patchValue({
      name: cat.name,
      parentCategoryId: cat.parentCategoryId ?? null
    });
  }

  // 🟣 Update category (PUT)
  updateCategory() {
    const id = this.editingId;
    if (!id) return;

    const payload = this.form.value;
    this.ps.updateCategory(id, payload).subscribe({
      next: () => {
        alert('✅ Category updated');
        this.cancelEdit();
        this.loadCategories();
      },
      error: (err) => {
        console.error('Update category failed', err);
        alert('❌ Update failed: ' + (err?.error?.message ?? err?.message ?? ''));
      }
    });
  }

  // 🟠 Delete category (DELETE)
  deleteCategory(id: number) {
    if (!confirm('Are you sure you want to delete this category?')) return;
    this.ps.deleteCategory(id).subscribe({
      next: () => {
        alert('🗑️ Category deleted');
        this.loadCategories();
      },
      error: (err) => {
        console.error('Delete category failed', err);
        alert('❌ Delete failed: ' + (err?.error?.message ?? err?.message ?? ''));
      }
    });
  }

  // cancel editing mode
  cancelEdit() {
    this.editingId = null;
    this.form.reset({ name: '', parentCategoryId: null });
  }
}
