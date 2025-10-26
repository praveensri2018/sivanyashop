// src/app/admin/order-management.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../services/order.service';

@Component({
  selector: 'app-admin-order-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './order-management.component.html'
})
export class AdminOrderManagementComponent implements OnInit {
  orders: any[] = [];
  loading = false;
  statusFilter = '';
  dateRange = { start: '', end: '' };
  stats = {
    total: 0,
    pending: 0,
    delivered: 0,
    revenue: 0
  };

  constructor(private orderService: OrderService) {}

  ngOnInit(): void {
    this.loadOrders();
    this.loadStats();
  }

  loadOrders(): void {
    this.loading = true;
    this.orderService.getAdminOrders({
      status: this.statusFilter,
      startDate: this.dateRange.start,
      endDate: this.dateRange.end
    }).subscribe({
      next: (response) => {
        this.orders = response.orders;
        this.loading = false;
      },
      error: (error) => {
        console.error('Failed to load orders', error);
        this.loading = false;
      }
    });
  }

  loadStats(): void {
    this.orderService.getOrderStats().subscribe({
      next: (response) => {
        this.stats = response.stats;
      },
      error: (error) => {
        console.error('Failed to load stats', error);
      }
    });
  }

  updateOrderStatus(orderId: number, newStatus: string): void {
    this.orderService.updateOrderStatus(orderId, newStatus)
      .subscribe({
        next: (response) => {
          this.loadOrders(); // Refresh list
        },
        error: (error) => {
          console.error('Failed to update order status', error);
          alert('Failed to update order status');
        }
      });
  }
}