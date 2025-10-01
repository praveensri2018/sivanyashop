// src/app/services/product.service.ts
// Provides a larger catalog of 20+ sample products.

import { Injectable } from '@angular/core';
import { Product } from '../models/product';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private products: Product[] = [
    // WOMEN
    {
      id: '1',
      title: 'Floral Summer Top',
      price: 699,
      mrp: 1199,
      description: 'Lightweight floral top — perfect for summer outings.',
      image: 'assets/products/floral-top.jpg',
      rating: 4.5,
      tags: ['Floral', 'Summer', 'Trendy'],
      category: 'Women'
    },
    {
      id: '2',
      title: 'Casual Cotton Tee',
      price: 399,
      mrp: 699,
      description: 'Everyday cotton tee, breathable and soft.',
      image: 'assets/products/cotton-tee.jpg',
      rating: 4.2,
      tags: ['Casual', 'Cotton', 'Unisex'],
      category: 'Women'
    },
    {
      id: '3',
      title: 'Elegant Kurti',
      price: 1299,
      mrp: 1999,
      description: 'Traditional kurti with modern elegance.',
      image: 'assets/products/kurti.jpg',
      rating: 4.7,
      tags: ['Traditional', 'Festival', 'Elegant'],
      category: 'Women'
    },
    {
      id: '4',
      title: 'Stylish Palazzo',
      price: 899,
      mrp: 1499,
      description: 'Breathable palazzo pants for outings.',
      image: 'assets/products/palazzo.jpg',
      rating: 4.1,
      tags: ['Comfort', 'Casual', 'Dailywear'],
      category: 'Women'
    },
    {
      id: '5',
      title: 'Denim Jacket',
      price: 1799,
      mrp: 2499,
      description: 'All-season denim jacket — stylish & versatile.',
      image: 'assets/products/denim-jacket.jpg',
      rating: 4.6,
      tags: ['Denim', 'Trendy'],
      category: 'Women'
    },
    {
      id: '6',
      title: 'Party Dress',
      price: 2299,
      mrp: 3199,
      description: 'Chic party dress with shimmer effect.',
      image: 'assets/products/party-dress.jpg',
      rating: 4.8,
      tags: ['Party', 'Evening'],
      category: 'Women'
    },

    // MEN
    {
      id: '7',
      title: 'Checked Shirt',
      price: 799,
      mrp: 1299,
      description: 'Slim fit checked shirt, cotton blend.',
      image: 'assets/products/checked-shirt.jpg',
      rating: 4.3,
      tags: ['Formal', 'Casual'],
      category: 'Men'
    },
    {
      id: '8',
      title: 'Casual Polo',
      price: 649,
      mrp: 999,
      description: 'Smart casual polo with contrast collar.',
      image: 'assets/products/polo.jpg',
      rating: 4.2,
      tags: ['Casual', 'Summer'],
      category: 'Men'
    },
    {
      id: '9',
      title: 'Slim Fit Jeans',
      price: 1399,
      mrp: 1999,
      description: 'Stretchable slim fit denim jeans.',
      image: 'assets/products/jeans.jpg',
      rating: 4.5,
      tags: ['Denim', 'Casual'],
      category: 'Men'
    },
    {
      id: '10',
      title: 'Hoodie Sweatshirt',
      price: 1199,
      mrp: 1699,
      description: 'Comfortable hoodie with front pocket.',
      image: 'assets/products/hoodie.jpg',
      rating: 4.4,
      tags: ['Winter', 'Casual'],
      category: 'Men'
    },
    {
      id: '11',
      title: 'Formal Blazer',
      price: 3499,
      mrp: 4999,
      description: 'Single-breasted formal blazer, navy blue.',
      image: 'assets/products/blazer.jpg',
      rating: 4.6,
      tags: ['Formal', 'Office'],
      category: 'Men'
    },

    // KIDS
    {
      id: '12',
      title: 'Kids T-shirt',
      price: 299,
      mrp: 499,
      description: 'Cute printed t-shirt for kids.',
      image: 'assets/products/kids-tshirt.jpg',
      rating: 4.3,
      tags: ['Kids', 'Casual'],
      category: 'Kids'
    }
  ];

  getAll(): Product[] {
    return [...this.products];
  }

  getById(id: string): Product | undefined {
    return this.products.find(p => p.id === id);
  }
}
