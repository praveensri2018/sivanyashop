// PLACE: src/app/admin/retailer-list.component.ts
// Modify your existing component to include the statusLabel and toggleActive methods.
// Only the relevant parts are shown — merge into your existing file or replace file.

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AdminRetailerService } from '../services/admin-retailer.service';

@Component({
  selector: 'app-admin-retailers',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './retailer-list.component.html',
  styleUrls: ['./retailer-list.component.scss']
})
export class AdminRetailerListComponent implements OnInit {
  retailers: any[] = [];
  loading = false;
  saving = false;
  formVisible = false;
  editingId: number | null = null;
  editForm!: FormGroup;

  // optional server error flags
  emailExistsError = false;
  emailErrorMessage = '';
  serverError = '';

  constructor(private fb: FormBuilder, private rs: AdminRetailerService) {}

  ngOnInit(): void {
    this.editForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: [''], // required for create only
      isActive: [true]
    });
    this.loadRetailers();
  }

 loadRetailers() {
  this.loading = true;
  this.rs.fetchRetailers().subscribe({
    next: (res: any) => {
      this.retailers = res?.data ?? res?.retailers ?? res ?? [];
      console.log('[Retailers] loaded items:', this.retailers); // TEMP: remove when OK
      this.loading = false;
    },
    error: (err) => { console.error('fetchRetailers', err); this.loading = false; }
  });
}

  openCreate() {
    this.editingId = null;
    this.formVisible = true;
    this.editForm.reset({ name: '', email: '', password: '', isActive: true });
    this.editForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
    this.editForm.get('password')?.updateValueAndValidity();
  }

  openEdit(r: any) {
    this.editingId = r.Id ?? r.id;
    this.formVisible = true;
    this.editForm.patchValue({ name: r.Name ?? r.name, email: r.Email ?? r.email, password: '' });
    this.editForm.get('password')?.clearValidators();
    this.editForm.get('password')?.updateValueAndValidity();
  }

  closeForm() {
    this.formVisible = false;
    this.editingId = null;
    this.editForm.reset();
    this.emailExistsError = false;
    this.serverError = '';
  }

  submitForm() {
    if (this.editForm.invalid) return;
    const payload: any = {
      name: this.editForm.value.name,
      email: this.editForm.value.email,
      isActive: !!this.editForm.value.isActive
    };
    if (!this.editingId && this.editForm.value.password) payload.password = this.editForm.value.password;

    this.saving = true;
    if (this.editingId) {
      this.rs.updateRetailer(this.editingId, payload).subscribe({
        next: () => { this.saving = false; this.closeForm(); this.loadRetailers(); alert('✅ Updated'); },
        error: (err: any) => {
          console.error('updateRetailer', err);
          this.saving = false;
          this.handleServerErrors(err);
          alert('❌ Update failed');
        }
      });
    } else {
      this.rs.createRetailer(payload).subscribe({
        next: () => { this.saving = false; this.closeForm(); this.loadRetailers(); alert('✅ Created'); },
        error: (err: any) => {
          console.error('createRetailer', err);
          this.saving = false;
          this.handleServerErrors(err);
          alert('❌ Create failed');
        }
      });
    }
  }

  confirmDelete(id: number) {
    if (!confirm('Delete retailer (soft delete)?')) return;
    this.rs.deleteRetailer(id).subscribe({
      next: () => { alert('✅ Deleted'); this.loadRetailers(); },
      error: (err) => { console.error('deleteRetailer', err); alert('❌ Delete failed'); }
    });
  }

  // ------------- NEW: helper label & toggle ---------------

  // Return human readable label
  statusLabel(isActive: boolean | null | undefined): string {
    return !!isActive ? 'Active' : 'Inactive';
  }

  // Toggle active/inactive when user clicks the badge.
  // Updates UI immediately (optimistic) and calls API. Reverts if API fails.
toggleActive(row: any) {
  const id = row.Id ?? row.id;
  if (!id) return;

  const current = this.getIsActive(row);
  const newState = !current;
  const label = newState ? 'activate' : 'deactivate';

  // ✅ Ask for confirmation before changing
  const confirmed = confirm(`Are you sure you want to ${label} this retailer?`);
  if (!confirmed) return;

  // Optimistic UI update
  row.IsActive = newState;
  row.isActive = newState;
  if (row.raw) {
    row.raw.IsActive = newState;
    row.raw.isActive = newState;
  }

  const payload = { isActive: newState }; // or IsActive if your API expects PascalCase

  this.rs.updateRetailer(id, payload).subscribe({
    next: () => {
      alert(`✅ Retailer ${newState ? 'activated' : 'deactivated'} successfully`);
    },
    error: (err: any) => {
      console.error('toggleActive update error', err);
      // Revert on error
      row.IsActive = current;
      row.isActive = current;
      if (row.raw) {
        row.raw.IsActive = current;
        row.raw.isActive = current;
      }
      alert('❌ Failed to update status: ' + (err?.error?.message || err.message || 'Unknown'));
    }
  });
}

  // Centralized server error handler for form submit
  private handleServerErrors(err: any) {
    // backend returns { success:false, message: "Email already exists" } in your earlier message
    const msg = err?.error?.message ?? err?.message ?? '';
    if (msg && msg.toLowerCase().includes('email')) {
      this.emailExistsError = true;
      this.emailErrorMessage = msg;
    } else {
      this.serverError = msg || 'Server error';
    }
  }

  getIsActive(row: any): boolean {
  if (!row) return false;
  // common field names used in various backends:
  const possible = [
    row.IsActive,
    row.isActive,
    row.Active,
    row.active,
    row.status,
    row.is_active
  ];
  for (const p of possible) {
    if (p === true) return true;
    if (p === false) return false;
    // handle numeric 0/1
    if (typeof p === 'number') return p === 1;
    // handle string 'true'/'false' or '1'/'0'
    if (typeof p === 'string') {
      const s = p.trim().toLowerCase();
      if (s === 'true' || s === '1') return true;
      if (s === 'false' || s === '0') return false;
    }
  }
  // if nothing matched, attempt to read from nested raw object
  if (row.raw && typeof row.raw.IsActive !== 'undefined') return !!row.raw.IsActive;
  return false;
}
}
