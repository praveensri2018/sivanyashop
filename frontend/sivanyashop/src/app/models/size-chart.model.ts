export interface SizeMeasurement {
  size: string;
  measurements: { [key: string]: number };
}

export interface SizeChart {
  id?: number;
  name: string;
  chartType: 'DRESS' | 'SHOES' | 'GENERAL';
  description?: string;
  measurements: SizeMeasurement[];
  isPrimary?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductSizeChart {
  productId: number;
  sizeChartId: number;
  isPrimary: boolean;
  createdAt?: string;
}