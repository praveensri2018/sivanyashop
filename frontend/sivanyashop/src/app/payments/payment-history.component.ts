import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OrderService, Payment } from '../services/order.service';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-payment-history',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './payment-history.component.html',
  styleUrls: ['./payment-history.component.scss']
})
export class PaymentHistoryComponent implements OnInit {
  payments: Payment[] = [];
  loading = false;
  isAdmin = false;
  
  // Filters
  statusFilter = '';
  page = 1;
  limit = 10;
  totalPages = 1;
  totalPayments = 0;

  // Admin only filter
  userIdFilter = '';

  constructor(
    private orderService: OrderService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.isAdmin = this.auth.getRole() === 'ADMIN';
    this.loadPayments();
  }

  loadPayments(): void {
    this.loading = true;
    
    const options: any = {
      page: this.page,
      limit: this.limit
    };
    
    if (this.statusFilter) options.status = this.statusFilter;
    if (this.isAdmin && this.userIdFilter) options.userId = parseInt(this.userIdFilter);

    this.orderService.getPaymentHistory(options).subscribe({
      next: (response: any) => {
        this.payments = response.payments || [];
        this.totalPages = response.pagination?.totalPages || 1;
        this.totalPayments = response.pagination?.total || 0;
        this.loading = false;
      },
      error: (error) => {
        console.error('Failed to load payments:', error);
        this.loading = false;
        alert('Failed to load payment history. Please try again.');
      }
    });
  }

    processRefund(payment: any): void {
    if (confirm(`Are you sure you want to process a refund for payment ${payment.id}?`)) {
      // Implement refund logic here
      console.log('Processing refund for payment:', payment);
      // You would typically call a refund service method here
      alert('Refund functionality would be implemented here. This would call your refund service.');
    }
  }

  onFilterChange(): void {
    this.page = 1;
    this.loadPayments();
  }

  onPageChange(newPage: number): void {
    this.page = newPage;
    this.loadPayments();
  }

  getStatusBadgeClass(status: string): string {
    const classes: any = {
      'PENDING': 'bg-warning text-dark',
      'PAID': 'bg-success text-white',
      'FAILED': 'bg-danger text-white',
      'REFUNDED': 'bg-info text-white',
      'PARTIALLY_REFUNDED': 'bg-warning text-dark'
    };
    return classes[status] || 'bg-light text-dark';
  }

  getPaymentMethodIcon(method: string): string {
    const icons: any = {
      'card': 'fas fa-credit-card',
      'netbanking': 'fas fa-university',
      'upi': 'fas fa-mobile-alt',
      'wallet': 'fas fa-wallet'
    };
    return icons[method?.toLowerCase()] || 'fas fa-money-bill-wave';
  }

  getPages(): number[] {
    const pages = [];
    for (let i = 1; i <= this.totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  viewPaymentDetails(paymentId: number): void {
    // Navigate to payment details page or show modal
    this.orderService.getPaymentDetails(paymentId).subscribe({
      next: (response) => {
        console.log('Payment details:', response.payment);
        // You can implement a modal or navigation here
        alert(`Payment Details:\nStatus: ${response.payment.status}\nAmount: ₹${response.payment.amount}\nMethod: ${response.payment.paymentMethod}`);
      },
      error: (error) => {
        console.error('Error fetching payment details:', error);
        alert('Failed to load payment details.');
      }
    });
  }
}