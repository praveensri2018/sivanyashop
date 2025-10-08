// FILE: src/app/admin/category-management.component.ts
// Standalone Category management component (Angular 18 style).
// Place this file at: src/app/admin/category-management.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { AdminProductService } from '../services/admin-product.service';

@Component({
  selector: 'app-admin-category-management',
  standalone: true,
  templateUrl: './category-management.component.html',
  styleUrls: ['./category-management.component.css'],
  imports: [CommonModule, ReactiveFormsModule]
})
export class CategoryManagementComponent implements OnInit {
  form!: FormGroup;
  categories: any[] = [];
  loading = false;

  constructor(private fb: FormBuilder, private ps: AdminProductService) {}

  ngOnInit(): void {
    // initialize form
    this.form = this.fb.group({
      name: [''],
      parentCategoryId: [null] // null => top-level
    });

    this.loadCategories();
  }
loadCategories() {
  this.loading = true;
  this.ps.fetchCategories().subscribe({
    next: (res: any) => {
      console.log('raw:', res);

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
    error: err => {
      console.error('Failed to load categories', err);
      this.loading = false;
    },
  });
}

  createCategory() {
    const payload = this.form.value;
    if (!payload.name || payload.name.trim() === '') {
      return alert('Please enter category name');
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
}
