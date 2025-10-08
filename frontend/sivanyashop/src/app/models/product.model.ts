// src/app/models/product.model.ts
export interface Category {
  id?: number;
  name: string;
  parentCategoryId?: number | null;
}

export interface Product {
  id?: number;
  name: string;
  description?: string;
  imagePath?: string;
  categoryIds?: number[];
}

export interface Variant {
  id?: number;
  productId: number;
  sku: string;
  variantName: string;
  attributes?: string;
  stockQty?: number;
}
