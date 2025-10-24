// Place file at: src/app/services/payment.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AppConfig } from '../app.config';
import { AuthService } from '../auth/auth.service';

// Server returns order with key_id injected from .env (public key)
export interface CreateOrderResponse {
  success: boolean;
  order: {
    id: string;        // Razorpay order id
    amount: number;    // in paise
    currency: string;  // usually 'INR'
    key_id?: string;   // <-- added: public Razorpay key id from backend
    // allow extra fields without TS errors
    [k: string]: any;
  };
}

// For clarity if you want to pass extra options
export interface CreateOrderPayload {
  amount: number;                   // in rupees (e.g., 499.00)
  currency?: string;                // default 'INR'
  receipt?: string | null;          // optional receipt/id
  notes?: Record<string, any> | {}; // optional metadata
}

@Injectable({ providedIn: 'root' })
export class PaymentService {
  // Place: src/app/services/payment.service.ts
  private base = AppConfig.apiBase.replace(/\/+$/, '') + '/api/payments';

  constructor(private http: HttpClient, private auth: AuthService) {}

  // Attach JWT if available; endpoint also works without auth if you prefer
  private headers(): HttpHeaders | undefined {
    const token = this.auth.getToken?.();
    if (!token) return undefined;
    return new HttpHeaders({ Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' });
  }

  // Create Razorpay order on backend. `amount` is in RUPEES.
  // You can call: createOrder(499) or createOrder(499, { notes: {...} })
  createOrder(amountInRupees: number, options: Omit<CreateOrderPayload, 'amount'> = {}): Observable<CreateOrderResponse> {
    const body: CreateOrderPayload = {
      amount: amountInRupees,
      currency: options.currency ?? 'INR',
      receipt: options.receipt ?? null,
      notes: options.notes ?? {}
    };
    const headers = this.headers();
    const opts = headers ? { headers } : {};
    return this.http.post<CreateOrderResponse>(`${this.base}/create-order`, body, opts).pipe(
      catchError(err => {
        console.error('createOrder failed', err);
        return throwError(() => err);
      })
    );
  }

  // Verify payment server-side after Razorpay success callback
  verifyPayment(payload: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    orderId?: number | string; // your internal order/cart id (optional)
  }): Observable<{ success: boolean; message?: string }> {
    const headers = this.headers();
    const opts = headers ? { headers } : {};
    return this.http.post<{ success: boolean; message?: string }>(`${this.base}/verify`, payload, opts).pipe(
      catchError(err => {
        console.error('verifyPayment failed', err);
        return throwError(() => err);
      })
    );
  }
}
