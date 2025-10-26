// order-details/order-details.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { OrderService } from '../services/order.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-order-details',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="container mt-4">
      <div class="row">
        <div class="col-12">
          <div class="d-flex align-items-center mb-4">
            <button class="btn btn-outline-secondary me-3" routerLink="/orders">
              ← Back to Orders
            </button>
            <h2 class="mb-0">Order Details</h2>
          </div>

          <div *ngIf="loading" class="text-center py-4">
            <div class="spinner-border" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-2">Loading order details...</p>
          </div>

          <div *ngIf="error" class="alert alert-danger">
            {{ error }}
          </div>

          <div *ngIf="order && !loading" class="card">
            <div class="card-header">
              <div class="row">
                <div class="col-md-6">
                  <strong>Order #{{ order.OrderNumber || order.orderNumber }}</strong>
                  <div class="text-muted small">
                    Placed on {{ (order.CreatedAt || order.createdAt) | date:'medium' }}
                  </div>
                </div>
                <div class="col-md-6 text-end">
                  <span class="badge" [ngClass]="getStatusBadgeClass(order.Status || order.status)">
                    {{ order.Status || order.status }}
                  </span>
                  <span class="badge ms-2" [ngClass]="getPaymentStatusBadgeClass(order.PaymentStatus || order.paymentStatus)">
                    {{ order.PaymentStatus || order.paymentStatus }}
                  </span>
                </div>
              </div>
            </div>

            <div class="card-body">
              <!-- Order Items -->
              <h5>Order Items</h5>
              <div *ngFor="let item of order.Items || order.items" class="border-bottom pb-3 mb-3">
                <div class="row align-items-center">
                  <div class="col-md-2">
                    <img [src]="item.Image || item.image || '/assets/no-image.jpg'" 
                         [alt]="item.ProductName || item.productName"
                         class="img-fluid rounded" style="max-height: 80px;">
                  </div>
                  <div class="col-md-6">
                    <strong>{{ item.ProductName || item.productName }}</strong>
                    <div *ngIf="item.VariantName || item.variantName" class="text-muted small">
                      {{ item.VariantName || item.variantName }}
                    </div>
                  </div>
                  <div class="col-md-2 text-center">
                    Qty: {{ item.Qty || item.qty }}
                  </div>
                  <div class="col-md-2 text-end">
                    ₹{{ item.Price || item.price }}
                  </div>
                </div>
              </div>

              <!-- Order Summary -->
              <div class="row mt-4">
                <div class="col-md-6">
                  <h6>Shipping Address</h6>
                  <div *ngIf="order.ShippingAddress || order.shippingAddress">
                    <p class="mb-1">{{ (order.ShippingAddress || order.shippingAddress).addressLine1 }}</p>
                    <p class="mb-1" *ngIf="(order.ShippingAddress || order.shippingAddress).addressLine2">
                      {{ (order.ShippingAddress || order.shippingAddress).addressLine2 }}
                    </p>
                    <p class="mb-1">
                      {{ (order.ShippingAddress || order.shippingAddress).city }}, 
                      {{ (order.ShippingAddress || order.shippingAddress).state }} - 
                      {{ (order.ShippingAddress || order.shippingAddress).postalCode }}
                    </p>
                    <p class="mb-0">{{ (order.ShippingAddress || order.shippingAddress).country }}</p>
                  </div>
                  <p *ngIf="!order.ShippingAddress && !order.shippingAddress" class="text-muted">
                    No shipping address available
                  </p>
                </div>
                <div class="col-md-6">
                  <div class="card bg-light">
                    <div class="card-body">
                      <h6>Order Summary</h6>
                      <div class="d-flex justify-content-between mb-2">
                        <span>Subtotal:</span>
                        <span>₹{{ order.TotalAmount || order.totalAmount }}</span>
                      </div>
                      <div class="d-flex justify-content-between mb-2">
                        <span>Shipping:</span>
                        <span>Free</span>
                      </div>
                      <hr>
                      <div class="d-flex justify-content-between fw-bold">
                        <span>Total:</span>
                        <span>₹{{ order.TotalAmount || order.totalAmount }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
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
      const orderId = params['id'];
      if (orderId) {
        this.loadOrderDetails(parseInt(orderId));
      } else {
        this.error = 'No order ID provided';
      }
    });
  }

  loadOrderDetails(orderId: number): void {
    this.loading = true;
    this.orderService.getOrderDetails(orderId)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (response: any) => {
          if (response.success) {
            this.order = response.order || response.data;
          } else {
            this.error = response.message || 'Failed to load order details';
          }
        },
        error: (err: any) => {
          console.error('Error loading order details:', err);
          this.error = 'Failed to load order details. Please try again.';
        }
      });
  }

  getStatusBadgeClass(status: string): string {
    const classes: any = {
      'PENDING': 'bg-warning text-dark',
      'CONFIRMED': 'bg-info text-white',
      'PROCESSING': 'bg-primary text-white',
      'SHIPPED': 'bg-secondary text-white',
      'DELIVERED': 'bg-success text-white',
      'CANCELLED': 'bg-danger text-white'
    };
    return classes[status] || 'bg-light text-dark';
  }

  getPaymentStatusBadgeClass(status: string): string {
    const classes: any = {
      'PENDING': 'bg-warning text-dark',
      'PAID': 'bg-success text-white',
      'FAILED': 'bg-danger text-white',
      'REFUNDED': 'bg-info text-white'
    };
    return classes[status] || 'bg-light text-dark';
  }
}