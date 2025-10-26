import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common'; // Add DatePipe
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { SizeChartService, SizeChartsResponse } from '../../services/size-chart.service';
import { SizeChart } from '../../models/size-chart.model';

@Component({
  selector: 'app-size-chart-list',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, // This enables routerLink
    FormsModule // This enables ngModel
  ],
  providers: [DatePipe], // Add DatePipe to providers
  templateUrl: './size-chart-list.component.html',
  styleUrls: ['./size-chart-list.component.scss']
})
export class SizeChartListComponent implements OnInit {
  sizeCharts: SizeChart[] = [];
  loading = false;
  page = 1;
  limit = 10;
  total = 0;
  totalPages = 1;
  chartTypeFilter = '';

  constructor(
    private sizeChartService: SizeChartService,
    private datePipe: DatePipe // Inject DatePipe
  ) {}

  ngOnInit(): void {
    this.loadSizeCharts();
  }

  loadSizeCharts(): void {
    this.loading = true;
    this.sizeChartService.getSizeCharts(this.page, this.limit, this.chartTypeFilter)
      .subscribe({
        next: (response: SizeChartsResponse) => {
          this.sizeCharts = response.sizeCharts;
          this.total = response.total;
          this.totalPages = response.totalPages;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading size charts:', error);
          this.loading = false;
        }
      });
  }

  onPageChange(newPage: number): void {
    this.page = newPage;
    this.loadSizeCharts();
  }

  onChartTypeFilterChange(): void {
    this.page = 1;
    this.loadSizeCharts();
  }

  deleteSizeChart(sizeChart: SizeChart): void {
    if (confirm(`Are you sure you want to delete "${sizeChart.name}"?`)) {
      this.sizeChartService.deleteSizeChart(sizeChart.id!)
        .subscribe({
          next: () => {
            this.loadSizeCharts();
          },
          error: (error) => {
            console.error('Error deleting size chart:', error);
            alert('Error deleting size chart');
          }
        });
    }
  }

  getChartTypeDisplay(type: string): string {
    const typeMap: { [key: string]: string } = {
      'DRESS': 'Dress',
      'SHOES': 'Shoes',
      'GENERAL': 'General'
    };
    return typeMap[type] || type;
  }

  // Add method to format date
  formatDate(dateString?: string): string {
    if (!dateString) return 'N/A';
    return this.datePipe.transform(dateString, 'medium') || 'N/A';
  }
}