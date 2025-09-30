// src/app/models/product.ts
// Product interface used across card, list, detail components.
// Extended with optional fields: mrp, image, rating, tags, category.

export interface Product {
  id: string;
  title: string;
  price: number;
  mrp?: number;
  description?: string;
  image?: string;
  rating?: number;      // 1–5 stars
  tags?: string[];      // keywords or highlights
  category?: string;    // e.g. "Women", "Men"
}
