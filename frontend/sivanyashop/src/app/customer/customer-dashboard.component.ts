import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService, UserPayload } from '../auth/auth.service';
import { ProductService } from '../services/product.service';
import { OrderService } from '../services/order.service';
import { finalize } from 'rxjs/operators';

interface ProductItem {
  id: number;
  name: string;
  description?: string;
  price?: number;
  image?: string;
  isActive?: boolean;
}

interface OrderItem {
  id: number;
  orderNumber: string;
  status: string;
  total: number;
  placedAt: string;
  itemsCount: number;
}

@Component({
  selector: 'app-customer-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './customer-dashboard.component.html',
  styleUrls: ['./customer-dashboard.component.scss']
})
export class CustomerDashboardComponent implements OnInit {
  user: UserPayload | null = null;

  // UI state
  activeTab: 'products' | 'orders' | 'profile' = 'products';

  // products
  products: ProductItem[] = [];
  productsLoading = false;
  productsPage = 1;
  productsLimit = 12;
  loading = false;
  
  // orders
  orders: OrderItem[] = [];
  ordersLoading = false;

  // quick search
  searchQuery = '';

  constructor(
    private auth: AuthService,
    private productSvc: ProductService,
    private orderSvc: OrderService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.user = this.auth.getUser();
    this.loadProducts();
    this.loadOrders();
  }


    goToProduct(productId: number): void {
    this.router.navigate(['/product', productId]);
  }
  
  /* ---------- products ---------- */
  loadProducts(reset = true) {
    if (reset) {
      this.productsPage = 1;
      this.products = [];
    }
    this.productsLoading = true;
    this.productSvc
      .fetchProducts(this.productsPage, this.productsLimit, this.searchQuery)
      .pipe(finalize(() => (this.productsLoading = false)))
      .subscribe({
        next: (res: any) => {
          // adapt to your API shape: { products: [], total, page }
          const list = res?.products ?? res?.data ?? (Array.isArray(res) ? res : []);
          this.products = (this.products || []).concat(
            (list || []).map((p: any) => ({
              id: p.ProductId ?? p.Id ?? p.id,
              name: p.ProductName ?? p.Name ?? p.name,
              description: p.Description ?? p.description,
              price: p.Price ?? p.price ?? p.customerPrice ?? null,
              image: this.pickImage(p),
              isActive: p.IsActive ?? p.isActive ?? true
            }))
          );
        },
        error: (err) => {
          console.error('loadProducts error', err);
        }
      });
  }

  loadMoreProducts() {
    this.productsPage++;
    this.loadProducts(false);
  }

  pickImage(p: any): string {
    if (!p) return '/assets/no-image.jpg';
    const raw = p.images ?? p.Images ?? p.ImageUrls ?? p.ImagePath ?? [];
    if (Array.isArray(raw) && raw.length) return raw[0].ImageUrl ?? raw[0].url ?? raw[0];
    if (typeof raw === 'string' && raw) return raw;
    return '/assets/no-image.jpg';
  }

  openProduct(p: ProductItem) {
    this.router.navigate(['/product', p.id]);
  }

  onSearch(): void {
    if (this.activeTab === 'products') {
      this.loadProducts();
    } else {
      this.loadOrders();
    }
  }

    setActiveTab(tab: 'products' | 'orders'): void {
    this.activeTab = tab;
    if (tab === 'products' && this.products.length === 0) this.loadProducts();
    if (tab === 'orders' && this.orders.length === 0) this.loadOrders();
  }

  /* ---------- orders ---------- */
  loadOrders() {
    this.ordersLoading = true;
    this.orderSvc
      .fetchMyOrders()
      .pipe(finalize(() => (this.ordersLoading = false)))
      .subscribe({
        next: (res: any) => {
          const list = res?.orders ?? res?.data ?? (Array.isArray(res) ? res : []);
          this.orders = (list || []).map((o: any) => ({
            id: o.OrderId ?? o.id ?? o.Id,
            orderNumber: o.OrderNumber ?? o.orderNumber ?? `#${o.Id ?? o.id ?? ''}`,
            status: o.Status ?? o.status ?? 'Unknown',
            total: o.Total ?? o.total ?? o.Amount ?? 0,
            placedAt: o.CreatedAt ?? o.placedAt ?? o.orderedAt ?? '',
            itemsCount: o.ItemsCount ?? o.itemsCount ?? (o.items ? o.items.length : 0)
          }));
        },
        error: (err) => {
          console.error('loadOrders error', err);
        }
      });
  }

  openOrder(o: OrderItem) {
    this.router.navigate(['/orders', o.id]);
  }

  /* ---------- profile ---------- */
  logout() {
    this.auth.logout();
    // go to home (PublicRedirectGuard will redirect if needed)
    this.router.navigate(['/']);
  }

  /* UI helpers */
  setTab(t: 'products' | 'orders' | 'profile') {
    this.activeTab = t;
    if (t === 'products' && this.products.length === 0) this.loadProducts();
    if (t === 'orders' && this.orders.length === 0) this.loadOrders();
  }
}
