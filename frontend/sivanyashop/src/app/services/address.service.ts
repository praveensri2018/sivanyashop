// Place at: src/app/services/address.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfig } from '../app.config';
import { AuthService } from '../auth/auth.service';

export interface ShippingAddress {
  id: number;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

@Injectable({ providedIn: 'root' })
export class AddressService {
  private base = `${AppConfig.apiBase}/api`;

  constructor(private http: HttpClient, private auth: AuthService) {}

  private headers(): HttpHeaders {
    const token = this.auth.getToken();
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  getUserAddresses(): Observable<{ addresses: ShippingAddress[] }> {
    return this.http.get<{ addresses: ShippingAddress[] }>(
      `${this.base}/user/addresses`,
      { headers: this.headers() }
    );
  }

  createAddress(address: Omit<ShippingAddress, 'id'>): Observable<{ address: ShippingAddress }> {
    return this.http.post<{ address: ShippingAddress }>(
      `${this.base}/user/addresses`,
      address,
      { headers: this.headers() }
    );
  }
}