import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OrderService, Order } from '../services/order.service';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-order-history',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './order-history.component.html',
  styleUrls: ['./order-history.component.scss']
})
export class OrderHistoryComponent implements OnInit {
 
  orders: Order[] = [];
  loading = false;
  isAdmin = false;
  
  // Filters
  statusFilter = '';
  paymentStatusFilter = '';
  page = 1;
  limit = 10;
  totalPages = 1;
  totalOrders = 0;

  // Admin only filter
  userIdFilter = '';

  constructor(
    private orderService: OrderService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.isAdmin = this.auth.getRole() === 'ADMIN';
    this.loadOrders();
  }


    getOrderId(order: any): number {
    if (Array.isArray(order.id)) {
      return order.id[0]; // Take the first element if it's an array
    }
    if (order.Id) {
      return order.Id; // Use PascalCase if available
    }
    return order.id; // Use camelCase as fallback
  }

   getOrderNumber(order: any): string {
    return order.OrderNumber || order.orderNumber || '';
  }

  getStatus(order: any): string {
    return order.Status || order.status || '';
  }

  getPaymentStatus(order: any): string {
    return order.PaymentStatus || order.paymentStatus || '';
  }

  getTotalAmount(order: any): number {
    return order.TotalAmount || order.totalAmount || 0;
  }

  getCreatedAt(order: any): string {
    return order.CreatedAt || order.createdAt || '';
  }

  getItemsCount(order: any): number {
    return order.ItemsCount || order.itemsCount || 0;
  }
  
  loadOrders(): void {
    this.loading = true;
    
    const options: any = {
      page: this.page,
      limit: this.limit
    };
    
    if (this.statusFilter) options.status = this.statusFilter;
    if (this.paymentStatusFilter) options.paymentStatus = this.paymentStatusFilter;
    if (this.isAdmin && this.userIdFilter) options.userId = parseInt(this.userIdFilter);

    const request = this.isAdmin 
      ? this.orderService.getAdminOrders(options)
      : this.orderService.getUserOrders(options);

    request.subscribe({
      next: (response: any) => {
        this.orders = response.orders || [];
        this.totalPages = response.pagination?.totalPages || 1;
        this.totalOrders = response.pagination?.total || 0;
        this.loading = false;
      },
      error: (error) => {
        console.error('Failed to load orders:', error);
        this.loading = false;
        alert('Failed to load orders. Please try again.');
      }
    });
  }

  onFilterChange(): void {
    this.page = 1;
    this.loadOrders();
  }

  onPageChange(newPage: number): void {
    this.page = newPage;
    this.loadOrders();
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
      'REFUNDED': 'bg-info text-white',
      'PARTIALLY_REFUNDED': 'bg-warning text-dark'
    };
    return classes[status] || 'bg-light text-dark';
  }

  retryPayment(order: Order): void {
    // Implement payment retry logic here
    alert('Payment retry functionality would be implemented here');
  }

  getPages(): number[] {
    const pages = [];
    for (let i = 1; i <= this.totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }
}