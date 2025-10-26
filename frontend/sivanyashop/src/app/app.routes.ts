import { Routes } from '@angular/router';
import { ShopComponent } from './shop/shop.component';
import { ProductDetailComponent } from './shop/product-detail.component';
import { CartComponent } from './cart/cart.component';
import { AdminComponent } from './admin/admin.component';
import { RetailerDashboardComponent } from './retailer/retailer-dashboard.component';
import { CustomerDashboardComponent } from './customer/customer-dashboard.component';
import { CustomerProductsComponent } from './customer/customer-products.component';
import { RoleGuard } from './auth/role.guard';
import { PublicRedirectGuard } from './auth/public-redirect.guard';
import { LoginComponent } from './auth/login.component';
import { ProductUploadComponent } from './admin/product-upload.component';
import { CategoryManagementComponent } from './admin/category-management.component';
import { ProductListComponent } from './admin/product-list.component';
import { AdminRetailerListComponent } from './admin/retailer-list.component';
import { RegisterComponent } from './auth/register.component';
import { OrderConfirmationComponent } from './order-confirmation/order-confirmation.component';
import { ShippingAddressComponent } from './checkout/shipping-address.component';
import { OrderHistoryComponent } from './customer/order-history.component';
import { PaymentHistoryComponent } from './payments/payment-history.component';
import { OrderDetailsComponent } from './order-details/order-details.component';
import { AdminOrderManagementComponent } from './admin/order-management.component';
import { SizeChartListComponent } from './admin/size-chart-list/size-chart-list.component';
import { SizeChartFormComponent } from './admin/size-chart-form/size-chart-form.component';

export const routes: Routes = [
  { path: '', component: ShopComponent, canActivate: [PublicRedirectGuard] },
  { path: 'product/:id', component: ProductDetailComponent },
  { path: 'cart', component: CartComponent, canActivate: [RoleGuard], data: { roles: ['customer','retailer'] } },
  { path: 'dashboard', component: CustomerDashboardComponent, canActivate: [RoleGuard], data: { roles: ['customer'] } },
  { path: 'product', component: CustomerProductsComponent, canActivate: [RoleGuard], data: { roles: ['customer','retailer'] } },
  { path: 'retailer', component: RetailerDashboardComponent, canActivate: [RoleGuard], data: { roles: ['retailer'] } },
  { path: 'admin', component: AdminComponent, canActivate: [RoleGuard], data: { roles: ['admin'] } },
  { path: 'login', component: LoginComponent },
  { path: 'admin/product-upload', component: ProductUploadComponent, canActivate: [RoleGuard], data: { roles: ['admin'] }},
  { path: 'admin/categories', component: CategoryManagementComponent, canActivate: [RoleGuard], data: { roles: ['admin'] } },
  { path: 'admin/products', component: ProductListComponent, canActivate: [RoleGuard], data: { roles: ['admin'] }  },
  { path: 'admin/retailers', component: AdminRetailerListComponent, canActivate: [RoleGuard], data: { roles: ['admin']  }},
  
  // New Size Chart Routes
  { path: 'admin/size-charts', component: SizeChartListComponent, canActivate: [RoleGuard], data: { roles: ['admin'] } },
  { path: 'admin/size-chart/create', component: SizeChartFormComponent, canActivate: [RoleGuard], data: { roles: ['admin'] } },
  { path: 'admin/size-chart/edit/:id', component: SizeChartFormComponent, canActivate: [RoleGuard], data: { roles: ['admin'] } },
  { path: 'admin/size-chart/view/:id', component: SizeChartFormComponent, canActivate: [RoleGuard], data: { roles: ['admin'] } },
  
  { path: 'register', component: RegisterComponent },
  { path: 'checkout', component: CartComponent, canActivate: [RoleGuard], data: { roles: ['customer','retailer'] } },
  { path: 'order-confirmation/:id', component: OrderConfirmationComponent, canActivate: [RoleGuard], data: { roles: ['customer','retailer'] } },
  { path: 'order-confirmation', component: OrderConfirmationComponent, canActivate: [RoleGuard], data: { roles: ['customer','retailer'] } },
  { path: 'orders', component: OrderHistoryComponent, canActivate: [RoleGuard], data: { roles: ['customer', 'admin', 'retailer'] } },
  { path: 'payment-history', component: PaymentHistoryComponent, canActivate: [RoleGuard], data: { roles: ['customer', 'admin', 'retailer'] } },
  { path: 'order-details/:id', component: OrderDetailsComponent, canActivate: [RoleGuard], data: { roles: ['customer', 'admin', 'retailer'] } },
  { path: 'admin/orders', component: AdminOrderManagementComponent,  canActivate: [RoleGuard],  data: { roles: ['admin'] } },
  { path: '**', redirectTo: '' }
];