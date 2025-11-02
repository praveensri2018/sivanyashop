/* FILE: src/app/order-history/order-history.component.ts
   REPLACE/CREATE: app/order-history/order-history.component.ts
   Notes:
   - Improved, full TS implementation using takeUntil for cleanup.
   - Badge class helpers return semantic classes (e.g. 'badge pending', 'payment-badge paid').
*/

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { OrderService, Order } from '../services/order.service';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-order-history',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './order-history.component.html',
  styleUrls: ['./order-history.component.scss']
})
export class OrderHistoryComponent implements OnInit, OnDestroy {

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

  private destroy$ = new Subject<void>();

  constructor(
    private orderService: OrderService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.isAdmin = (this.auth.getRole?.() || '').toString().toUpperCase() === 'ADMIN';
    this.loadOrders();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /* ---------- Normalizers (handle different API shapes) ---------- */

  private asNumber(val: any, fallback = 0): number {
    const n = Number(val);
    return Number.isFinite(n) ? n : fallback;
  }

  getOrderId(order: any): number | string {
    // Handles id arrays, PascalCase, camelCase
    if (!order) return '';
    if (Array.isArray(order.id) && order.id.length) return order.id[0];
    if (order.Id !== undefined && order.Id !== null) return order.Id;
    if (order.id !== undefined && order.id !== null) return order.id;
    // fallback: check other naming
    return order.orderId ?? order.OrderId ?? '';
  }

  getOrderNumber(order: any): string {
    if (!order) return '';
    return order.OrderNumber ?? order.orderNumber ?? order.order_no ?? '';
  }

  getStatus(order: any): string {
    if (!order) return '';
    return (order.Status ?? order.status ?? '').toString().toUpperCase();
  }

  getPaymentStatus(order: any): string {
    if (!order) return '';
    return (order.PaymentStatus ?? order.paymentStatus ?? '').toString().toUpperCase();
  }

  getTotalAmount(order: any): number {
    if (!order) return 0;
    // try multiple common fields and parse safely
    return this.asNumber(order.TotalAmount ?? order.totalAmount ?? order.amount ?? order.Total ?? 0, 0);
  }

  getCreatedAt(order: any): string {
    if (!order) return '';
    return order.CreatedAt ?? order.createdAt ?? order.created ?? '';
  }

  getItemsCount(order: any): number {
    if (!order) return 0;
    return this.asNumber(order.ItemsCount ?? order.itemsCount ?? order.items?.length ?? 0, 0);
  }

  /* ---------- Load / Filters / Pagination ---------- */

  loadOrders(): void {
    this.loading = true;

    const options: any = {
      page: this.page,
      limit: this.limit
    };

    if (this.statusFilter) options.status = this.statusFilter;
    if (this.paymentStatusFilter) options.paymentStatus = this.paymentStatusFilter;
    if (this.isAdmin && this.userIdFilter) {
      // allow empty or invalid input gracefully
      const uid = parseInt(this.userIdFilter as any, 10);
      if (!Number.isNaN(uid)) options.userId = uid;
    }

    const request$ = this.isAdmin
      ? this.orderService.getAdminOrders(options)
      : this.orderService.getUserOrders(options);

    request$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          // normalize response shape
          this.orders = response?.orders ?? response?.data ?? [];
          // pagination shape tolerant
          this.totalPages = response?.pagination?.totalPages ?? response?.meta?.totalPages ?? (this.orders?.length ? 1 : 1);
          this.totalOrders = response?.pagination?.total ?? response?.meta?.total ?? this.orders.length;
          this.loading = false;
        },
        error: (err) => {
          console.error('Failed to load orders:', err);
          this.orders = [];
          this.totalPages = 1;
          this.totalOrders = 0;
          this.loading = false;
          // optional: show user-friendly message (avoid alert in production)
          // alert('Failed to load orders. Please try again.');
        }
      });
  }

  onFilterChange(): void {
    this.page = 1;
    this.loadOrders();
  }

  onPageChange(newPage: number): void {
    if (newPage < 1 || newPage > this.totalPages || newPage === this.page) return;
    this.page = newPage;
    this.loadOrders();
  }

  getPages(): number[] {
    const pages: number[] = [];
    const total = Math.max(1, this.totalPages || 1);
    for (let i = 1; i <= total; i++) pages.push(i);
    return pages;
  }

  /* ---------- Badge class helpers (return CSS class names compatible with SCSS) ---------- */

  /**
   * Returns classes for status badge.
   * Example output: 'badge pending' or 'badge delivered'
   */
  getStatusBadgeClass(statusRaw: string): string {
    const status = (statusRaw || '').toString().toUpperCase();
    const map: Record<string, string> = {
      'PENDING': 'badge pending',
      'CONFIRMED': 'badge confirmed',
      'PROCESSING': 'badge processing',
      'SHIPPED': 'badge shipped',
      'DELIVERED': 'badge delivered',
      'CANCELLED': 'badge cancelled'
    };
    return map[status] ?? 'badge';
  }

  /**
   * Returns classes for payment status badge.
   * Example output: 'payment-badge paid' or 'payment-badge failed'
   */
  getPaymentStatusBadgeClass(statusRaw: string): string {
    const status = (statusRaw || '').toString().toUpperCase();
    const map: Record<string, string> = {
      'PENDING': 'payment-badge pending',
      'PAID': 'payment-badge paid',
      'FAILED': 'payment-badge failed',
      'REFUNDED': 'payment-badge refunded',
      'PARTIALLY_REFUNDED': 'payment-badge partial-refunded'
    };
    return map[status] ?? 'payment-badge';
  }

  /* ---------- Actions ---------- */

  retryPayment(order: Order | any): void {
    // Example placeholder: call orderService.retryPayment(...) then reload
    if (!order) return;
    const id = this.getOrderId(order);
    // Minimal UX: confirm before retry in UI
    if (!confirm('Retry payment for order #' + (this.getOrderNumber(order) || id) + '?')) return;

    
  }
}
