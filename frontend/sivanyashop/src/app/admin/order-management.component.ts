import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OrderService, Order } from '../services/order.service';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-admin-order-management',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './order-management.component.html',
  styleUrls: ['./order-management.component.scss']
})
export class AdminOrderManagementComponent implements OnInit {
  orders: Order[] = [];
  loading = false;
  updatingStatus: { [key: number]: boolean } = {};
  
  // Filters
  statusFilter = '';
  paymentStatusFilter = '';
  userIdFilter = '';
  page = 1;
  limit = 10;
  totalPages = 1;
  totalOrders = 0;

  // Status update
  selectedOrder: Order | null = null;
  newStatus = '';
  statusNotes = '';

  // Statistics
  stats = {
    total: 0,
    pending: 0,
    confirmed: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    revenue: 0
  };

  constructor(
    private orderService: OrderService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.loadOrders();
    this.loadStats();
  }

  loadOrders(): void {
    this.loading = true;
    
    const options: any = {
      page: this.page,
      limit: this.limit
    };
    
    if (this.statusFilter) options.status = this.statusFilter;
    if (this.paymentStatusFilter) options.paymentStatus = this.paymentStatusFilter;
    if (this.userIdFilter) options.userId = parseInt(this.userIdFilter);

    this.orderService.getAdminOrders(options).subscribe({
      next: (response: any) => {
        this.orders = response.orders || [];
        this.totalPages = response.pagination?.totalPages || 1;
        this.totalOrders = response.pagination?.total || 0;
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Failed to load orders:', error);
        this.loading = false;
        alert('Failed to load orders. Please try again.');
      }
    });
  }

  loadStats(): void {
    // Load order statistics
    this.orderService.getAdminOrders({ limit: 1000 }).subscribe({
      next: (response: any) => {
        const allOrders = response.orders || [];
        this.calculateStats(allOrders);
      },
      error: (error: any) => {
        console.error('Failed to load stats:', error);
      }
    });
  }

  calculateStats(orders: Order[]): void {
    this.stats = {
      total: orders.length,
      pending: orders.filter(o => o.Status === 'PENDING').length,
      confirmed: orders.filter(o => o.Status === 'CONFIRMED').length,
      processing: orders.filter(o => o.Status === 'PROCESSING').length,
      shipped: orders.filter(o => o.Status === 'SHIPPED').length,
      delivered: orders.filter(o => o.Status === 'DELIVERED').length,
      cancelled: orders.filter(o => o.Status === 'CANCELLED').length,
      revenue: orders
        .filter(o => o.PaymentStatus === 'PAID')
        .reduce((sum, order) => sum + (order.TotalAmount || 0), 0)
    };
  }

  onFilterChange(): void {
    this.page = 1;
    this.loadOrders();
  }

  onPageChange(newPage: number): void {
    this.page = newPage;
    this.loadOrders();
  }

  openStatusUpdate(order: Order): void {
    this.selectedOrder = order;
    this.newStatus = order.Status || '';
    this.statusNotes = '';
  }

  updateOrderStatus(): void {
    if (!this.selectedOrder || !this.newStatus) return;

    const orderId = this.getOrderId(this.selectedOrder);
    this.updatingStatus[orderId] = true;

    this.orderService.updateOrderStatus(orderId, this.newStatus, this.statusNotes).subscribe({
      next: (response: any) => {
        if (response.success) {
          // Update local order status
          const orderIndex = this.orders.findIndex(o => this.getOrderId(o) === orderId);
          if (orderIndex !== -1) {
            this.orders[orderIndex].Status = this.newStatus;
          }
          this.selectedOrder = null;
          this.loadStats(); // Refresh stats
          alert('Order status updated successfully!');
        } else {
          alert('Failed to update order status: ' + response.message);
        }
        this.updatingStatus[orderId] = false;
      },
      error: (error: any) => {
        console.error('Error updating order status:', error);
        alert('Failed to update order status. Please try again.');
        this.updatingStatus[orderId] = false;
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
      'REFUNDED': 'bg-info text-white',
      'PARTIALLY_REFUNDED': 'bg-warning text-dark'
    };
    return classes[status] || 'bg-light text-dark';
  }

  getOrderId(order: any): number {
    if (Array.isArray(order.id)) return order.id[0];
    return order.id || order.Id;
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

  getPages(): number[] {
    const pages = [];
    for (let i = 1; i <= this.totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }
}