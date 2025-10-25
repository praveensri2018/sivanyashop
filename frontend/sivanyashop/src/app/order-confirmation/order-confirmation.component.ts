import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { OrderService } from '../services/order.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-order-confirmation',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="order-confirmation container py-4">
      <div class="card">
        <div class="card-body text-center">
          <div class="success-icon">✅</div>
          <h2 class="text-success">Order Confirmed!</h2>
          
          <div *ngIf="order" class="order-details mt-4">
            <p><strong>Order Number:</strong> {{ order.OrderNumber || order.orderNumber }}</p>
            <p><strong>Total Amount:</strong> ₹{{ order.TotalAmount || order.totalAmount }}</p>
            <p><strong>Status:</strong> <span class="badge bg-success">{{ order.Status || order.status }}</span></p>
            <p><strong>Order Date:</strong> {{ order.CreatedAt | date:'medium' }}</p>
          </div>

          <div *ngIf="loading" class="loading">
            Loading order details...
          </div>

          <div *ngIf="error" class="alert alert-danger mt-3">
            {{ error }}
          </div>

          <div class="mt-4">
            <button routerLink="/dashboard" class="btn btn-primary me-2">View Dashboard</button>
            <button routerLink="/" class="btn btn-outline-secondary">Continue Shopping</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .order-confirmation {
      max-width: 600px;
      margin: 0 auto;
    }
    .success-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }
    .order-details {
      text-align: left;
      background: #f8f9fa;
      padding: 1.5rem;
      border-radius: 8px;
    }
    .badge {
      font-size: 0.8rem;
      padding: 0.25rem 0.5rem;
    }
    .loading {
      color: #6c757d;
      font-style: italic;
    }
  `]
})
export class OrderConfirmationComponent implements OnInit {
  order: any = null;
  loading = false;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private orderSvc: OrderService
  ) {}

  ngOnInit() {
    // Try to get order ID from route params first, then from query params
    const orderId = this.route.snapshot.paramMap.get('id') || 
                   this.route.snapshot.queryParamMap.get('orderId');
    
    if (orderId) {
      this.loadOrderDetails(parseInt(orderId, 10));
    } else {
      // If no order ID, show generic success message
      this.error = 'Order ID not found, but payment was successful. Please check your orders.';
    }
  }

  private loadOrderDetails(orderId: number) {
    this.loading = true;
    this.orderSvc.getOrderById(orderId).pipe(
      finalize(() => this.loading = false)
    ).subscribe({
      next: (res) => {
        if (res.order) {
          this.order = res.order;
        } else {
          this.error = 'Order details not found, but payment was successful.';
        }
      },
      error: (err) => {
        console.error('Failed to load order details', err);
        this.error = 'Failed to load order details, but payment was successful. Please check your orders.';
      }
    });
  }
}