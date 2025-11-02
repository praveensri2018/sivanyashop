import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { OrderService } from '../services/order.service';

@Component({
  selector: 'app-order-details',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './order-details.component.html',
  styleUrls: ['./order-details.component.scss']
})
export class OrderDetailsComponent implements OnInit {
  order: any = null;
  loading = false;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private orderService: OrderService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const orderId = Number(params['id']);
      if (orderId) {
        this.loadOrderDetails(orderId);
      } else {
        this.error = 'Invalid or missing order ID.';
      }
    });
  }

  /** Fetch and normalize API data */
  loadOrderDetails(orderId: number): void {
    this.loading = true;
    this.error = null;

    this.orderService
      .getOrderDetails(orderId)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (response: any) => {
          if (response?.success && response?.order) {
            this.order = this.normalizeOrder(response.order);
          } else {
            this.error = response?.message || 'Order not found.';
          }
        },
        error: (err) => {
          console.error('Error loading order details:', err);
          this.error = 'Failed to load order details. Please try again.';
        }
      });
  }

  /** Normalize API structure to what the template expects */
  private normalizeOrder(apiOrder: any): any {
    if (!apiOrder) return null;

    return {
      // Handle possible array fields
      id: Array.isArray(apiOrder.Id) ? apiOrder.Id[0] : apiOrder.Id,
      status: apiOrder.Status ?? 'UNKNOWN',
      paymentStatus: apiOrder.PaymentStatus ?? 'UNKNOWN',
      totalAmount: apiOrder.TotalAmount ?? 0,
      createdAt: Array.isArray(apiOrder.CreatedAt)
        ? apiOrder.CreatedAt[0]
        : apiOrder.CreatedAt,

      // Fallback order number (if backend doesn’t send)
      orderNumber: apiOrder.Id ? `ORD-${Array.isArray(apiOrder.Id) ? apiOrder.Id[0] : apiOrder.Id}` : '',

      // Wrap flat address into nested object
      shippingAddress: {
        addressLine1: apiOrder.AddressLine1 ?? '',
        addressLine2: apiOrder.AddressLine2 ?? '',
        city: apiOrder.City ?? '',
        state: apiOrder.State ?? '',
        postalCode: apiOrder.PostalCode ?? '',
        country: apiOrder.Country ?? '',
      },

      // Items, payments, history default to empty arrays
      items: apiOrder.items ?? [],
      payments: apiOrder.payments ?? [],
      statusHistory: apiOrder.statusHistory ?? [],
    };
  }

  /** Badge class helpers */
  getStatusBadgeClass(status: string): string {
    const s = (status || '').toUpperCase();
    const map: Record<string, string> = {
      'PENDING': 'bg-warning text-dark',
      'CONFIRMED': 'bg-info text-white',
      'PROCESSING': 'bg-primary text-white',
      'SHIPPED': 'bg-secondary text-white',
      'DELIVERED': 'bg-success text-white',
      'CANCELLED': 'bg-danger text-white'
    };
    return map[s] || 'bg-light text-dark';
  }

  getPaymentStatusBadgeClass(status: string): string {
    const s = (status || '').toUpperCase();
    const map: Record<string, string> = {
      'PENDING': 'bg-warning text-dark',
      'PAID': 'bg-success text-white',
      'FAILED': 'bg-danger text-white',
      'REFUNDED': 'bg-info text-white',
      'PARTIALLY_REFUNDED': 'bg-warning text-dark'
    };
    return map[s] || 'bg-light text-dark';
  }
}
