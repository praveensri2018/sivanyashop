import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { SizeChart } from '../models/size-chart.model';
import { AppConfig } from '../app.config';

export interface SizeChartsResponse {
  success: boolean;
  sizeCharts: SizeChart[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SizeChartResponse {
  success: boolean;
  sizeChart: SizeChart;
  message?: string;
}

export interface ProductSizeChartsResponse {
  success: boolean;
  sizeCharts: SizeChart[];
}

@Injectable({
  providedIn: 'root'
})
export class SizeChartService {
  private apiBase = `${AppConfig.apiBase}/api/size-charts`;

  constructor(private http: HttpClient) {}

  // Admin methods
  createSizeChart(sizeChart: Omit<SizeChart, 'id'>): Observable<SizeChartResponse> {
    return this.http.post<SizeChartResponse>(this.apiBase, sizeChart);
  }

  getSizeCharts(page: number = 1, limit: number = 20, chartType?: string): Observable<SizeChartsResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    
    if (chartType) {
      params = params.set('chartType', chartType);
    }

    return this.http.get<SizeChartsResponse>(this.apiBase, { params });
  }

  getSizeChartById(id: number): Observable<SizeChartResponse> {
    return this.http.get<SizeChartResponse>(`${this.apiBase}/${id}`);
  }

  updateSizeChart(id: number, sizeChart: Partial<SizeChart>): Observable<SizeChartResponse> {
    return this.http.put<SizeChartResponse>(`${this.apiBase}/${id}`, sizeChart);
  }

  deleteSizeChart(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiBase}/${id}`);
  }

  assignSizeChartToProduct(productId: number, sizeChartId: number, isPrimary: boolean = false): Observable<any> {
    return this.http.post(`${this.apiBase}/assign`, {
      productId,
      sizeChartId,
      isPrimary
    });
  }

  removeSizeChartFromProduct(productId: number, sizeChartId: number): Observable<any> {
    return this.http.post(`${this.apiBase}/remove`, {
      productId,
      sizeChartId
    });
  }

  setPrimarySizeChart(productId: number, sizeChartId: number): Observable<any> {
    return this.http.post(`${this.apiBase}/set-primary`, {
      productId,
      sizeChartId
    });
  }

  // Public methods (for customers)
  getProductSizeCharts(productId: number): Observable<ProductSizeChartsResponse> {
    return this.http.get<ProductSizeChartsResponse>(`${this.apiBase}/product/${productId}`);
  }

  getPrimarySizeChart(productId: number): Observable<SizeChartResponse> {
    return this.http.get<SizeChartResponse>(`${this.apiBase}/product/${productId}/primary`);
  }
}