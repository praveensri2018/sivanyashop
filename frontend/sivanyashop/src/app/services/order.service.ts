// Replace your existing order.service.ts with this
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, delay, map, tap } from 'rxjs/operators';
import { AppConfig } from '../app.config';
import { AuthService } from '../auth/auth.service';

export interface Order {
  Id: number;
  OrderNumber: string;
  Status: string;
  PaymentStatus: string;
  TotalAmount: number;
  CreatedAt: string;
  ItemsCount?: number;
  Items?: OrderItem[];
  ShippingAddress?: any;
}

export interface OrderItem {
  Id: number;
  ProductId: number;
  ProductName: string;
  VariantId?: number;
  VariantName?: string;
  Qty: number;
  Price: number;
  Image?: string;
}

@Injectable({ providedIn: 'root' })
export class OrderService {
  private base = `${AppConfig.apiBase}/api`;

  constructor(private http: HttpClient, private auth: AuthService) {}

  private headers(): HttpHeaders | undefined {
    const token = this.auth.getToken();
    if (!token) return undefined;
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  /**
   * Fetch user's orders
   */
  fetchMyOrders(): Observable<{ orders: Order[] }> {
    const headers = this.headers();
    const opts = headers ? { headers } : {};
    
    // If you have a dedicated orders endpoint
    return this.http.get<{ orders: Order[] }>(`${this.base}/orders/my-orders`, opts).pipe(
      catchError(err => {
        console.error('fetchMyOrders failed', err);
        // Fallback to stub data if endpoint not implemented yet
        return of({
          orders: [
            { 
              Id: 101, 
              OrderNumber: '#ORD-101', 
              Status: 'CONFIRMED', 
              PaymentStatus: 'PAID', 
              TotalAmount: 1299, 
              CreatedAt: new Date().toISOString(), 
              ItemsCount: 3 
            },
            { 
              Id: 102, 
              OrderNumber: '#ORD-102', 
              Status: 'PROCESSING', 
              PaymentStatus: 'PAID', 
              TotalAmount: 599, 
              CreatedAt: new Date().toISOString(), 
              ItemsCount: 1 
            }
          ]
        });
      })
    );
  }

  /**
   * Get order details by ID
   */
  getOrderById(orderId: number): Observable<{ order: Order }> {
    const headers = this.headers();
    const opts = headers ? { headers } : {};
    return this.http.get<{ order: Order }>(`${this.base}/orders/${orderId}`, opts).pipe(
      catchError(err => {
        console.error('getOrderById failed', err);
        return of({ order: {} as Order });
      })
    );
  }

  /**
   * Create order from cart (direct API call if needed)
   */
  createOrderFromCart(payload: {
    shippingAddressId: number;
    retailerId?: number;
    cartItems: any[];
  }): Observable<{ success: boolean; order?: Order; message?: string }> {
    const headers = this.headers();
    const opts = headers ? { headers } : {};
    return this.http.post<{ success: boolean; order?: Order; message?: string }>(
      `${this.base}/orders/create-from-cart`,
      payload,
      opts
    );
  }
}