// src/app/app.routes.ts
// Place file at: src/app/app.routes.ts

import { Routes } from '@angular/router';
import { ShopComponent } from './shop/shop.component';                 // create: src/app/shop/shop.component.ts
import { ProductDetailComponent } from './shop/product-detail.component'; // create
import { CartComponent } from './cart/cart.component';                 // create
//import { LoginComponent } from './auth/login.component';              // create

export const routes: Routes = [
  { path: '', component: ShopComponent },                // feed / landing
  { path: 'product/:id', component: ProductDetailComponent },
  { path: 'cart', component: CartComponent },
 // { path: 'login', component: LoginComponent },
  { path: '**', redirectTo: '' }
];
