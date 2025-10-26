import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ShippingAddressService } from '../services/shipping-address.service';
import { ShippingAddress } from '../models/shipping-address.model';

@Component({
  selector: 'app-shipping-address',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './shipping-address.component.html',
  styleUrls: ['./shipping-address.component.scss']
})
export class ShippingAddressComponent implements OnInit {
  @Output() addressSelected = new EventEmitter<number>();
  
  addresses: ShippingAddress[] = [];
  showAddressForm = false;
  editingAddress: ShippingAddress | null = null;
  addressForm!: FormGroup;
  loading = false;
  selectedAddressId: number | null = null;

  constructor(
    private addressService: ShippingAddressService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadAddresses();
  }

  initForm(): void {
    this.addressForm = this.fb.group({
      addressLine1: ['', [Validators.required, Validators.minLength(5)]],
      addressLine2: [''],
      city: ['', [Validators.required]],
      state: ['', [Validators.required]],
      postalCode: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
      country: ['India', [Validators.required]],
      isDefault: [false]
    });
  }

  loadAddresses(): void {
    this.loading = true;
    this.addressService.getUserAddresses().subscribe({
      next: (response) => {
        this.addresses = response.addresses || [];
        this.loading = false;
        
        // Auto-select default address if available
        const defaultAddress = this.addresses.find(addr => addr.isDefault);
        if (defaultAddress && defaultAddress.id) {
          this.selectAddress(defaultAddress.id);
        }
      },
      error: (err) => {
        console.error('Failed to load addresses', err);
        this.loading = false;
      }
    });
  }

  // Add this missing method
  getSelectedAddress(): ShippingAddress | null {
    if (!this.selectedAddressId) return null;
    return this.addresses.find(addr => addr.id === this.selectedAddressId) || null;
  }

  openAddForm(): void {
    this.editingAddress = null;
    this.showAddressForm = true;
    this.addressForm.reset({
      country: 'India',
      isDefault: false
    });
  }

  openEditForm(address: ShippingAddress): void {
    this.editingAddress = address;
    this.showAddressForm = true;
    this.addressForm.patchValue({
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 || '',
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
      isDefault: address.isDefault
    });
  }

  closeForm(): void {
    this.showAddressForm = false;
    this.editingAddress = null;
    this.addressForm.reset({
      country: 'India',
      isDefault: false
    });
  }

  submitAddress(): void {
    if (this.addressForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.loading = true;
    const formData = this.addressForm.value;

    if (this.editingAddress) {
      this.addressService.updateAddress(this.editingAddress.id!, formData).subscribe({
        next: (response) => {
          this.loadAddresses();
          this.closeForm();
          this.loading = false;
        },
        error: (err) => {
          console.error('Failed to update address', err);
          this.loading = false;
        }
      });
    } else {
      this.addressService.createAddress(formData).subscribe({
        next: (response) => {
          this.loadAddresses();
          this.closeForm();
          this.loading = false;
        },
        error: (err) => {
          console.error('Failed to create address', err);
          this.loading = false;
        }
      });
    }
  }

  selectAddress(addressId: number): void {
    this.selectedAddressId = addressId;
    this.addressSelected.emit(addressId);
  }

  setDefaultAddress(addressId: number): void {
    this.addressService.setDefaultAddress(addressId).subscribe({
      next: () => {
        this.loadAddresses();
      },
      error: (err) => {
        console.error('Failed to set default address', err);
      }
    });
  }

  deleteAddress(addressId: number): void {
    if (confirm('Are you sure you want to delete this address?')) {
      this.addressService.deleteAddress(addressId).subscribe({
        next: () => {
          this.loadAddresses();
          // If deleted address was selected, clear selection
          if (this.selectedAddressId === addressId) {
            this.selectedAddressId = null;
            this.addressSelected.emit(0);
          }
        },
        error: (err) => {
          console.error('Failed to delete address', err);
        }
      });
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.addressForm.controls).forEach(key => {
      const control = this.addressForm.get(key);
      control?.markAsTouched();
    });
  }

  get addressLine1() { return this.addressForm.get('addressLine1'); }
  get city() { return this.addressForm.get('city'); }
  get state() { return this.addressForm.get('state'); }
  get postalCode() { return this.addressForm.get('postalCode'); }
  get country() { return this.addressForm.get('country'); }
}