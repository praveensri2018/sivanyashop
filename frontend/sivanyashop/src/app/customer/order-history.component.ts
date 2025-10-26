// src/app/customer/order-history.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { OrderService } from '../services/order.service';
import { FormsModule } from '@angular/forms';

interface Order {
  id: number;
  orderNumber: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  itemsCount: number;
  items?: OrderItem[];
}

interface OrderItem {
  id: number;
  productName: string;
  variantName?: string;
  qty: number;
  price: number;
  image?: string;
}

@Component({
  selector: 'app-order-history',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './order-history.component.html'
})
export class OrderHistoryComponent implements OnInit {
  orders: Order[] = [];
  loading = false;
  page = 1;
  limit = 10;
  totalPages = 1;
  statusFilter = '';

  constructor(private orderService: OrderService) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.loading = true;
    this.orderService.getOrderHistory(this.page, this.limit, this.statusFilter)
      .subscribe({
        next: (response: any) => {
          this.orders = response.orders;
          this.totalPages = response.pagination.totalPages;
          this.loading = false;
        },
        error: (error) => {
          console.error('Failed to load orders', error);
          this.loading = false;
        }
      });
  }

  onPageChange(newPage: number): void {
    this.page = newPage;
    this.loadOrders();
  }

  onStatusFilterChange(): void {
    this.page = 1;
    this.loadOrders();
  }

  getStatusClass(status: string): string {
    const statusClasses: { [key: string]: string } = {
      'PENDING': 'bg-warning text-dark',
      'CONFIRMED': 'bg-info text-white',
      'PROCESSING': 'bg-primary text-white',
      'SHIPPED': 'bg-secondary text-white',
      'DELIVERED': 'bg-success text-white',
      'CANCELLED': 'bg-danger text-white'
    };
    return statusClasses[status] || 'bg-light text-dark';
  }
}