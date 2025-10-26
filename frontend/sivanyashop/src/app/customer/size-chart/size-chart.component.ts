import { Component, Input, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SizeChartService } from '../../services/size-chart.service';
import { SizeChart } from '../../models/size-chart.model';

@Component({
  selector: 'app-size-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './size-chart.component.html',
  styleUrls: ['./size-chart.component.scss']
})
export class SizeChartComponent implements OnInit, OnChanges {
  @Input() productId!: number;
  @Input() displayMode: 'table' | 'visual' = 'table';
  
  sizeCharts: SizeChart[] = [];
  primarySizeChart: SizeChart | null = null;
  loading = false;
  selectedSize: string | null = null;
  activeTab: 'table' | 'visual' = 'table';

  constructor(private sizeChartService: SizeChartService) {}

  ngOnInit(): void {
    this.loadSizeCharts();
  }

  ngOnChanges(): void {
    if (this.productId) {
      this.loadSizeCharts();
    }
  }

  loadSizeCharts(): void {
    if (!this.productId) return;

    this.loading = true;
    this.sizeChartService.getProductSizeCharts(this.productId).subscribe({
      next: (response) => {
        this.sizeCharts = response.sizeCharts;
        this.primarySizeChart = this.sizeCharts.find(chart => chart.isPrimary) || this.sizeCharts[0] || null;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading size charts:', error);
        this.loading = false;
      }
    });
  }

  getCurrentSizeChart(): SizeChart | null {
    return this.primarySizeChart;
  }

  getMeasurementKeys(): string[] {
    const chart = this.getCurrentSizeChart();
    if (!chart || chart.measurements.length === 0) return [];
    
    return Object.keys(chart.measurements[0].measurements);
  }

  getAvailableSizes(): any[] {
    const chart = this.getCurrentSizeChart();
    return chart ? chart.measurements : [];
  }

  getSelectedSizeMeasurements(): { key: string; value: number }[] {
    if (!this.selectedSize) return [];
    
    const chart = this.getCurrentSizeChart();
    const sizeData = chart?.measurements.find(m => m.size === this.selectedSize);
    
    if (!sizeData) return [];
    
    return Object.entries(sizeData.measurements).map(([key, value]) => ({
      key,
      value: value as number // Type assertion to fix the error
    }));
  }

  selectSize(size: string): void {
    this.selectedSize = this.selectedSize === size ? null : size;
  }

  hasSizeCharts(): boolean {
    return this.sizeCharts.length > 0;
  }

  switchTab(tab: 'table' | 'visual'): void {
    this.activeTab = tab;
    if (tab === 'visual' && !this.selectedSize && this.getAvailableSizes().length > 0) {
      this.selectedSize = this.getAvailableSizes()[0].size;
    }
  }

  // Fixed getBarWidth method
  getBarWidth(value: number): number {
    if (!this.getAvailableSizes().length) return 0;
    
    // Get all measurement values to find the maximum
    const allValues = this.getAvailableSizes().flatMap(size => 
      Object.values(size.measurements).map(val => Number(val)) // Convert to numbers
    );
    
    const maxValue = Math.max(...allValues);
    return maxValue > 0 ? (value / maxValue) * 100 : 0;
  }
}