// Place file at: src/app/cart/cart.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService } from '../services/cart.service'; // ensure this service exists in your project
import { Observable } from 'rxjs';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss']
})
export class CartComponent implements OnInit {
  items$!: Observable<any[]>;   // observable stream of cart items
  total$!: Observable<number>;  // total price observable
  loading = false;

  constructor(private cart: CartService) {}

  ngOnInit(): void {
    // CartService should expose observables `items$` and `total$` (or adapt these lines)
    this.items$ = this.cart.items$;
    this.total$ = this.cart.total$;
  }

  removeItem(itemId: number | string) {
    this.cart.remove(itemId);
  }

  updateQty(item: any, delta: number) {
    const newQty = (item.qty || 1) + delta;
    if (newQty <= 0) {
      this.cart.remove(item.id);
    } else {
      this.cart.update(item.id, { qty: newQty });
    }
  }

  clearCart() {
    this.cart.clear();
  }

  checkout() {
    // navigate to checkout or trigger checkout flow
    // keep minimal: just log for now
    console.log('Proceed to checkout');
  }
}
