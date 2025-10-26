import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { AppConfig } from '../app.config';
import { AuthService } from '../auth/auth.service';
import { ShippingAddress } from '../models/shipping-address.model';

@Injectable({ providedIn: 'root' })
export class ShippingAddressService {
  private base = `${AppConfig.apiBase}/api/shipping-address`;

  constructor(private http: HttpClient, private auth: AuthService) {}

  private headers(): HttpHeaders {
    const token = this.auth.getToken();
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  // Helper method to transform PascalCase to camelCase
  private transformAddress(address: any): ShippingAddress {
    return {
      id: address.Id || address.id,
      userId: address.UserId || address.userId,
      addressLine1: address.AddressLine1 || address.addressLine1,
      addressLine2: address.AddressLine2 || address.addressLine2,
      city: address.City || address.city,
      state: address.State || address.state,
      postalCode: address.PostalCode || address.postalCode,
      country: address.Country || address.country,
      isDefault: address.IsDefault || address.isDefault,
      createdAt: address.CreatedAt || address.createdAt
    };
  }

  getUserAddresses(): Observable<{ success: boolean; addresses: ShippingAddress[] }> {
    return this.http.get<{ success: boolean; addresses: ShippingAddress[] }>(
      `${this.base}`,
      { headers: this.headers() }
    ).pipe(
      map(response => ({
        ...response,
        addresses: (response.addresses || []).map(addr => this.transformAddress(addr))
      }))
    );
  }

  getAddress(addressId: number): Observable<{ success: boolean; address: ShippingAddress }> {
    return this.http.get<{ success: boolean; address: ShippingAddress }>(
      `${this.base}/${addressId}`,
      { headers: this.headers() }
    ).pipe(
      map(response => ({
        ...response,
        address: this.transformAddress(response.address)
      }))
    );
  }

  createAddress(addressData: Omit<ShippingAddress, 'id'>): Observable<{ success: boolean; address: ShippingAddress }> {
    return this.http.post<{ success: boolean; address: ShippingAddress }>(
      `${this.base}`,
      addressData,
      { headers: this.headers() }
    ).pipe(
      map(response => ({
        ...response,
        address: this.transformAddress(response.address)
      }))
    );
  }

  updateAddress(addressId: number, addressData: Partial<ShippingAddress>): Observable<{ success: boolean; address: ShippingAddress }> {
    return this.http.put<{ success: boolean; address: ShippingAddress }>(
      `${this.base}/${addressId}`,
      addressData,
      { headers: this.headers() }
    ).pipe(
      map(response => ({
        ...response,
        address: this.transformAddress(response.address)
      }))
    );
  }

  deleteAddress(addressId: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.base}/${addressId}`,
      { headers: this.headers() }
    );
  }

  setDefaultAddress(addressId: number): Observable<{ success: boolean; address: ShippingAddress }> {
    return this.http.patch<{ success: boolean; address: ShippingAddress }>(
      `${this.base}/${addressId}/set-default`,
      {},
      { headers: this.headers() }
    ).pipe(
      map(response => ({
        ...response,
        address: this.transformAddress(response.address)
      }))
    );
  }

  getDefaultAddress(): Observable<{ success: boolean; address: ShippingAddress }> {
    return this.http.get<{ success: boolean; address: ShippingAddress }>(
      `${this.base}/default`,
      { headers: this.headers() }
    ).pipe(
      map(response => ({
        ...response,
        address: this.transformAddress(response.address)
      }))
    );
  }
}