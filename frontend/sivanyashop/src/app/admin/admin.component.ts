// Place file at: src/app/admin/admin.component.ts
// REPLACE existing file with this content.
//
// Notes:
// - This is a ready-to-drop standalone AdminComponent TS file.
// - It provides placeholder KPI properties (totalOrders, totalRevenue, totalCustomers, totalProducts).
// - It injects AuthService (to get current user) and Router (optional navigation helper).
// - Use your backend/services to populate the KPI fields (see TODO comments).
// - Keep method `onNavigate()` if you want to perform any client-side tracking or close UI bits on nav.

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

  // KPI placeholders — replace with real data from services
totalOrders: number | null = null;
totalRevenue: number | null = null;
totalCustomers: number | null = null;
totalProducts: number | null = null;

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // load current user (synchronous method from your AuthService)
    try {
      this.user = this.auth.getUser();
    } catch (err) {
      this.user = null;
    }

    // TODO: replace these placeholder fetches with real API/service calls
    // Example (pseudo):
    // this.adminService.getDashboardKpis().subscribe(k => {
    //   this.totalOrders = k.orders;
    //   this.totalRevenue = k.revenue;
    //   this.totalCustomers = k.customers;
    //   this.totalProducts = k.products;
    // });
  }

  /**
   * Optional helper invoked from template links when navigating inside the admin.
   * Keeps a single place to run side-effects (close menus, analytics, etc).
   *
   * Usage: add (click)="onNavigate('/admin/products')" or keep as no-arg to simply close UI.
   */
  onNavigate(path?: string) {
    // example: close any open menus, track analytics, etc.
    // e.g. this.menuService.close(); this.analytics.track('admin_nav', { path });

    if (path) {
      this.router.navigateByUrl(path).catch(err => {
        console.warn('Navigation failed', err);
      });
    }
  }
}
