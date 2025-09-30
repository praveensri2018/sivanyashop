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
    },
    {
      id: '13',
      title: 'Kids Frock',
      price: 799,
      mrp: 1199,
      description: 'Colorful frock with ribbon belt.',
      image: 'assets/products/kids-frock.jpg',
      rating: 4.7,
      tags: ['Party', 'Girls'],
      category: 'Kids'
    },
    {
      id: '14',
      title: 'Kids Shorts',
      price: 399,
      mrp: 699,
      description: 'Cotton shorts pack of 2.',
      image: 'assets/products/kids-shorts.jpg',
      rating: 4.2,
      tags: ['Summer', 'Boys'],
      category: 'Kids'
    },

    // ACCESSORIES
    {
      id: '15',
      title: 'Leather Wallet',
      price: 999,
      mrp: 1499,
      description: 'Classic brown genuine leather wallet.',
      image: 'assets/products/wallet.jpg',
      rating: 4.6,
      tags: ['Men', 'Accessories'],
      category: 'Accessories'
    },
    {
      id: '16',
      title: 'Analog Wrist Watch',
      price: 1599,
      mrp: 2499,
      description: 'Stylish analog wrist watch with leather strap.',
      image: 'assets/products/watch.jpg',
      rating: 4.4,
      tags: ['Men', 'Classic'],
      category: 'Accessories'
    },
    {
      id: '17',
      title: 'Women Handbag',
      price: 1899,
      mrp: 2699,
      description: 'Trendy handbag with multiple compartments.',
      image: 'assets/products/handbag.jpg',
      rating: 4.5,
      tags: ['Women', 'Fashion'],
      category: 'Accessories'
    },

    // HOME
    {
      id: '18',
      title: 'Cushion Cover Set',
      price: 499,
      mrp: 899,
      description: 'Set of 5 decorative cushion covers.',
      image: 'assets/products/cushion.jpg',
      rating: 4.2,
      tags: ['Home', 'Decor'],
      category: 'Home'
    },
    {
      id: '19',
      title: 'Bed Sheet',
      price: 1199,
      mrp: 1799,
      description: 'Cotton king size bed sheet with 2 pillow covers.',
      image: 'assets/products/bedsheet.jpg',
      rating: 4.4,
      tags: ['Home', 'Comfort'],
      category: 'Home'
    },
    {
      id: '20',
      title: 'Wall Clock',
      price: 899,
      mrp: 1399,
      description: 'Minimal round wall clock.',
      image: 'assets/products/clock.jpg',
      rating: 4.3,
      tags: ['Home', 'Decor'],
      category: 'Home'
    },

    // BEAUTY
    {
      id: '21',
      title: 'Lipstick Set',
      price: 599,
      mrp: 999,
      description: 'Set of 3 matte lipsticks.',
      image: 'assets/products/lipstick.jpg',
      rating: 4.5,
      tags: ['Women', 'Beauty'],
      category: 'Beauty'
    },
    {
      id: '22',
      title: 'Face Cream',
      price: 499,
      mrp: 799,
      description: 'Moisturizing cream for daily use.',
      image: 'assets/products/cream.jpg',
      rating: 4.2,
      tags: ['Skincare', 'Beauty'],
      category: 'Beauty'
    }
  ];

  getAll(): Product[] {
    return [...this.products];
  }

  getById(id: string): Product | undefined {
    return this.products.find(p => p.id === id);
  }
}
