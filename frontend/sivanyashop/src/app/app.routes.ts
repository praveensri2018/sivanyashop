import { Routes } from '@angular/router';
import { ShopComponent } from './shop/shop.component';
import { ProductDetailComponent } from './shop/product-detail.component';
import { CartComponent } from './cart/cart.component';
import { AdminComponent } from './admin/admin.component';
import { RetailerDashboardComponent } from './retailer/retailer-dashboard.component';
import { CustomerDashboardComponent } from './customer/customer-dashboard.component';
import { RoleGuard } from './auth/role.guard';
import { PublicRedirectGuard } from './auth/public-redirect.guard';
import { LoginComponent } from './auth/login.component';
import { ProductUploadComponent } from './admin/product-upload.component';
import { CategoryManagementComponent } from './admin/category-management.component';
import { ProductListComponent } from './admin/product-list.component';

export const routes: Routes = [
  { path: '', component: ShopComponent, canActivate: [PublicRedirectGuard] },
  { path: 'product/:id', component: ProductDetailComponent },
  { path: 'cart', component: CartComponent, canActivate: [RoleGuard], data: { roles: ['customer'] } },
  { path: 'dashboard', component: CustomerDashboardComponent, canActivate: [RoleGuard], data: { roles: ['customer'] } },
  { path: 'retailer', component: RetailerDashboardComponent, canActivate: [RoleGuard], data: { roles: ['retailer'] } },
  { path: 'admin', component: AdminComponent, canActivate: [RoleGuard], data: { roles: ['admin'] } },
  { path: 'login', component: LoginComponent },
  { path: 'admin/product-upload', component: ProductUploadComponent},
  { path: 'admin/categories', component: CategoryManagementComponent },
    { path: 'admin/products', component: ProductListComponent  },
  { path: '**', redirectTo: '' }
];
