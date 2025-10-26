// Update your existing order.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
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
  user?: {
    id: number;
    name: string;
    email: string;
  };
  
  // Frontend properties (handle both cases)
  id?: number | number[]; // Allow array temporarily
  orderNumber?: string;
  status?: string;
  paymentStatus?: string;
  totalAmount?: number;
  createdAt?: string;
  itemsCount?: number;
  items?: OrderItem[];
  shippingAddress?: any;
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

export interface OrderHistoryResponse {
  success: boolean;
  orders: Order[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface Payment {
  id: number;
  orderId: number;
  orderNumber: string;
  paymentGatewayOrderId: string;
  paymentGatewayPaymentId: string;
  amount: number;
  currency: string;
  status: string;
  paymentMethod: string;
  createdAt: string;
  orderAmount: number;
  user?: { // For admin only
    id: number;
    name: string;
    email: string;
  };
}

export interface PaymentHistoryResponse {
  success: boolean;
  payments: Payment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PaymentDetailsResponse {
  success: boolean;
  payment: Payment;
}

@Injectable({ providedIn: 'root' })
export class OrderService {
  private base = `${AppConfig.apiBase}/api/orders`;

  constructor(private http: HttpClient, private auth: AuthService) {}

  private headers(): HttpHeaders {
    const token = this.auth.getToken();
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  // Customer order history
getUserOrders(options: {
  page?: number;
  limit?: number;
  status?: string;
  paymentStatus?: string;
} = {}): Observable<OrderHistoryResponse> {
  let params = new HttpParams();
  
  if (options.page) params = params.set('page', options.page.toString());
  if (options.limit) params = params.set('limit', options.limit.toString());
  if (options.status) params = params.set('status', options.status);
  if (options.paymentStatus) params = params.set('paymentStatus', options.paymentStatus);

  return this.http.get<OrderHistoryResponse>(`${this.base}/history`, {
    headers: this.headers(),
    params
  }).pipe(
    map(response => {
      // Fix the duplicate ID issue
      if (response.orders) {
        response.orders = response.orders.map(order => ({
          ...order,
          id: Array.isArray(order.id) ? order.id[0] : order.id
        }));
      }
      return response;
    }),
    catchError(error => {
      console.error('Error fetching user orders:', error);
      throw error;
    })
  );
}

  // Add these methods to your existing order.service.ts

// Get orders for current user (customer dashboard)
fetchMyOrders(): Observable<any> {
  return this.http.get<any>(`${this.base}/history`, {
    headers: this.headers(),
    params: new HttpParams().set('limit', '5') // Get recent 5 orders for dashboard
  }).pipe(
    catchError(error => {
      console.error('Error fetching my orders:', error);
      throw error;
    })
  );
}

// Get order by ID
getOrderById(orderId: number): Observable<any> {
  return this.http.get<any>(`${this.base}/${orderId}`, {
    headers: this.headers()
  }).pipe(
    catchError(error => {
      console.error('Error fetching order by ID:', error);
      throw error;
    })
  );
}

// Get orders with pagination (for customer products component)
getOrders(page: number = 1, limit: number = 10, status?: string): Observable<any> {
  let params = new HttpParams()
    .set('page', page.toString())
    .set('limit', limit.toString());
  
  if (status) {
    params = params.set('status', status);
  }

  return this.http.get<any>(`${this.base}/history`, {
    headers: this.headers(),
    params
  }).pipe(
    catchError(error => {
      console.error('Error fetching orders:', error);
      throw error;
    })
  );
}

  // Admin order history
  getAdminOrders(options: {
    page?: number;
    limit?: number;
    status?: string;
    paymentStatus?: string;
    userId?: number;
  } = {}): Observable<OrderHistoryResponse> {
    let params = new HttpParams();
    
    if (options.page) params = params.set('page', options.page.toString());
    if (options.limit) params = params.set('limit', options.limit.toString());
    if (options.status) params = params.set('status', options.status);
    if (options.paymentStatus) params = params.set('paymentStatus', options.paymentStatus);
    if (options.userId) params = params.set('userId', options.userId.toString());

    return this.http.get<OrderHistoryResponse>(`${this.base}/admin/history`, {
      headers: this.headers(),
      params
    }).pipe(
      catchError(error => {
        console.error('Error fetching admin orders:', error);
        throw error;
      })
    );
  }

  // Payment history for both customer and admin
  getPaymentHistory(options: {
    page?: number;
    limit?: number;
    status?: string;
    userId?: number;
  } = {}): Observable<PaymentHistoryResponse> {
    let params = new HttpParams();
    
    if (options.page) params = params.set('page', options.page.toString());
    if (options.limit) params = params.set('limit', options.limit.toString());
    if (options.status) params = params.set('status', options.status);
    if (options.userId) params = params.set('userId', options.userId.toString());

    return this.http.get<PaymentHistoryResponse>(`${this.base}/history/payments`, {
      headers: this.headers(),
      params
    }).pipe(
      catchError(error => {
        console.error('Error fetching payment history:', error);
        throw error;
      })
    );
  }

  // Get payment details
  getPaymentDetails(paymentId: number): Observable<PaymentDetailsResponse> {
    return this.http.get<PaymentDetailsResponse>(`${this.base}/payment/${paymentId}`, {
      headers: this.headers()
    }).pipe(
      catchError(error => {
        console.error('Error fetching payment details:', error);
        throw error;
      })
    );
  }

  // Get order details (existing, keep it)
  getOrderDetails(orderId: number): Observable<any> {
    return this.http.get<any>(`${this.base}/${orderId}`, {
      headers: this.headers()
    }).pipe(
      catchError(error => {
        console.error('Error fetching order details:', error);
        throw error;
      })
    );
  }

  // Update order status (admin only)
  updateOrderStatus(orderId: number, status: string, notes?: string): Observable<any> {
    return this.http.put(`${this.base}/admin/${orderId}/status`, 
      { status, notes },
      { headers: this.headers() }
    ).pipe(
      catchError(error => {
        console.error('Error updating order status:', error);
        throw error;
      })
    );
  }

  // Request refund
  requestRefund(orderId: number, reason: string, items: any[], amount: number): Observable<any> {
    return this.http.post(`${this.base}/${orderId}/refund`, 
      { reason, items, amount },
      { headers: this.headers() }
    ).pipe(
      catchError(error => {
        console.error('Error requesting refund:', error);
        throw error;
      })
    );
  }
}