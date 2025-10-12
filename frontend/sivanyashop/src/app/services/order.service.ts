// simple order service stub — replace with real HTTP
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class OrderService {
  fetchMyOrders(): Observable<any> {
    const orders = [
      { OrderId: 101, OrderNumber: '#101', Status: 'Delivered', Total: 1299, CreatedAt: new Date().toISOString(), ItemsCount: 3 },
      { OrderId: 102, OrderNumber: '#102', Status: 'Processing', Total: 599, CreatedAt: new Date().toISOString(), ItemsCount: 1 },
      { OrderId: 103, OrderNumber: '#103', Status: 'Cancelled', Total: 0, CreatedAt: new Date().toISOString(), ItemsCount: 0 }
    ];
    return of({ orders }).pipe(delay(400));
  }
}
