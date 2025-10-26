import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AppConfig } from '../app.config';
import { AuthService } from '../auth/auth.service';

export interface CreateOrderResponse {
  success: boolean;
  order: {
    id: string;        
    amount: number;    
    currency: string;  
    key_id?: string;   
    [k: string]: any;
  };
}

export interface CreateOrderPayload {
  amount: number;                   
  currency?: string;                
  receipt?: string | null;          
  notes?: Record<string, any>| {};
  shippingAddressId?: number; 
}

export interface VerifyPaymentPayload {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  cartItems?: any[];
  shippingAddressId?: number;
  retailerId?: number | null;
}

export interface VerifyPaymentResponse {
  success: boolean;
  message?: string;
  orderId?: number;
  paymentId?: number;
  shippingAddressId?: number;
  order?: any;
}

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private base = AppConfig.apiBase.replace(/\/+$/, '') + '/api/payments';

  constructor(private http: HttpClient, private auth: AuthService) {}

  private headers(): HttpHeaders | undefined {
    const token = this.auth.getToken?.();
    if (!token) return undefined;
    return new HttpHeaders({ 
      Authorization: `Bearer ${token}`, 
      'Content-Type': 'application/json' 
    });
  }

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

  createOrderWithItems(payload: CreateOrderPayload): Observable<CreateOrderResponse> {
    const headers = this.headers();
    const opts = headers ? { headers } : {};
    return this.http.post<CreateOrderResponse>(`${this.base}/create-order`, payload, opts).pipe(
      catchError(err => {
        console.error('createOrderWithItems failed', err);
        return throwError(() => err);
      })
    );
  }

  checkStock(items: any[]) {
    return this.http.post<any>(`${this.base}/check-stock`, { items });
  }


  verifyPaymentAndCreateOrder(payload: VerifyPaymentPayload): Observable<VerifyPaymentResponse> {
    const headers = this.headers();
    const opts = headers ? { headers } : {};

    return this.http.post<VerifyPaymentResponse>(
      `${this.base}/verify`,
      payload,
      opts
    ).pipe(
      catchError(err => {
        console.error('verifyPaymentAndCreateOrder failed', err);
        return throwError(() => err);
      })
    );
  }

  verifyPayment(payload: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    orderId?: number | string; 
  }): Observable<{ success: boolean; message?: string }> {
    const headers = this.headers();
    const opts = headers ? { headers } : {};
    return this.http.post<{ success: boolean; message?: string }>(
      `${this.base}/verify`, 
      payload, 
      opts
    ).pipe(
      catchError(err => {
        console.error('verifyPayment failed', err);
        return throwError(() => err);
      })
    );
  }
}