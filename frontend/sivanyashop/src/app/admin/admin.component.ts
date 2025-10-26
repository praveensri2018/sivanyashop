// FILE: src/app/admin/admin.component.ts
// REPLACE the existing file at src/app/admin/admin.component.ts with this content.
// (Standalone AdminComponent — placeholder data for KPIs and recentActivity. Replace TODOs with real service calls.)

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService, UserPayload } from '../auth/auth.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit {
  user: UserPayload | null = null;

  // KPI placeholders
  totalOrders: number | null = null;
  totalRevenue: number | null = null;
  totalCustomers: number | null = null;
  totalProducts: number | null = null;

  // UI-friendly KPI array used by template
  kpis: Array<{ label: string, value: string | number, icon: string, meta?: string }> = [];

  // Recent activity placeholder
  recentActivity: Array<{ title: string, time: string, type?: string }> = [];

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Load current user
    try {
      this.user = this.auth.getUser();
    } catch (err) {
      this.user = null;
    }

    // TODO: Replace the following mock data with real API calls / services
    this.totalOrders = 1245;
    this.totalRevenue = 578320;
    this.totalCustomers = 842;
    this.totalProducts = 320;

    // Build UI kpis array
    this.kpis = [
      { label: 'Orders', value: this.totalOrders ?? 0, icon: '<i class="fas fa-shopping-bag"></i>', meta: '+3.2%' },
      { label: 'Revenue', value: `₹ ${this.totalRevenue ?? 0}`, icon: '<i class="fas fa-rupee-sign"></i>', meta: '+6.1%' },
      { label: 'Customers', value: this.totalCustomers ?? 0, icon: '<i class="fas fa-users"></i>', meta: '+1.8%' },
      { label: 'Products', value: this.totalProducts ?? 0, icon: '<i class="fas fa-boxes"></i>', meta: '' }
    ];

    // Mock recent activity (replace with service)
    this.recentActivity = [
      { title: 'Order #A123 created', time: '2h ago', type: 'order' },
      { title: 'Stock updated for SKU-XL', time: '3h ago', type: 'stock' },
      { title: 'New retailer: "Kala Traders"', time: '6h ago', type: 'user' },
    ];

    // Example: fetch real KPIs from adminService
    // this.adminService.getDashboardKpis().subscribe(k => {
    //   this.totalOrders = k.orders; this.totalRevenue = k.revenue;
    //   this.totalCustomers = k.customers; this.totalProducts = k.products;
    //   // rebuild kpis
    // });
  }

  onNavigate(path?: string) {
    if (path) {
      this.router.navigateByUrl(path).catch(err => console.warn('Navigation failed', err));
    }
    // add analytics or close UI bits here if needed
  }
}
