// PLACE: src/app/services/admin-retailer.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AppConfig } from '../app.config';

@Injectable({ providedIn: 'root' })
export class AdminRetailerService {
  private base = `${AppConfig.apiBase}/api`;

  constructor(private http: HttpClient) {}

  fetchRetailers(): Observable<any> {
    return this.http.get(`${this.base}/retailers`).pipe(tap(res => console.log('[API] fetchRetailers', res)));
  }

  fetchRetailerById(id: number): Observable<any> {
    return this.http.get(`${this.base}/retailers/${id}`).pipe(tap(res => console.log('[API] fetchRetailerById', res)));
  }

  createRetailer(payload: any): Observable<any> {
    return this.http.post(`${this.base}/retailers`, payload).pipe(tap(res => console.log('[API] createRetailer', res)));
  }

  updateRetailer(id: number, payload: any): Observable<any> {
    return this.http.put(`${this.base}/retailers/${id}`, payload).pipe(tap(res => console.log('[API] updateRetailer', res)));
  }

  deleteRetailer(id: number): Observable<any> {
    return this.http.delete(`${this.base}/retailers/${id}`).pipe(tap(res => console.log('[API] deleteRetailer', res)));
  }
}
