# Angular Frontend - Customer-First Structure (Fast, Minimal)

## Goals
- Customer pages prioritized in initial bundle for fastest UX.
- Lazy-load admin and retailer modules.
- Small initial bundle, defer heavy components and admin code.
- Use HTTP caching, service worker, and CDN for static assets.

## Project layout (customer-first)
src/
├── main.ts                            # ✅ bootstrap entry (no AppModule)
├── index.html
├── styles.scss
│
└── app/
    ├── app.component.html             # Root layout (header + footer + router)
    ├── app.component.scss
    ├── app.component.ts               # Root standalone component
    ├── app.routes.ts                  # Central route definitions
    ├── app.config.ts                  # ✅ Angular providers + AppConfig constants
    │
    ├── ui/                            # 🧩 shared layout components
    │   ├── header.component.ts
    │   ├── header.component.html
    │   ├── header.component.scss
    │   ├── footer.component.ts
    │   ├── footer.component.html
    │   └── footer.component.scss
    │
    ├── auth/                          # 🔐 authentication & guards
    │   ├── auth.service.ts
    │   ├── auth.interceptor.ts
    │   ├── role.guard.ts
    │   ├── public-redirect.guard.ts
    │   └── login.component.ts
    │
    ├── services/                      # ⚙️ API and data services
    │   └── admin-product.service.ts   # your Postman admin/product APIs
    │
    ├── shop/                          # 🛍️ public pages
    │   ├── shop.component.ts
    │   ├── shop.component.html
    │   ├── shop.component.scss
    │   ├── product-detail.component.ts
    │   ├── product-detail.component.html
    │   └── product-detail.component.scss
    │
    ├── cart/                          # 🛒 cart pages
    │   ├── cart.component.ts
    │   ├── cart.component.html
    │   └── cart.component.scss
    │
    ├── customer/                      # 👤 customer dashboard
    │   ├── customer-dashboard.component.ts
    │   ├── customer-dashboard.component.html
    │   └── customer-dashboard.component.scss
    │
    ├── retailer/                      # 🏪 retailer dashboard
    │   ├── retailer-dashboard.component.ts
    │   ├── retailer-dashboard.component.html
    │   └── retailer-dashboard.component.scss
    │
    └── admin/                         # 🧑‍💼 admin area
        ├── admin.component.ts
        ├── admin.component.html
        ├── admin.component.scss
        └── (future admin submodules)


## Customer features (implement first)
1. Browse & Search - fast paginated catalog.
2. Product detail & quick-view with EffectivePrice.
3. Add to Cart / Mini-cart (localStorage + server sync).
4. Fast Checkout - one-page, saved addresses/payment methods.
5. Order Tracking & History with status timeline.
6. Referrals - redeem referral code on signup/profile.
7. Wishlist and Notifications.

## Admin: retailer management
- Admin can create retailers (creates Users with Role='RETAILER' and generates ReferralCode).
- Admin can set initial wholesale defaults (RetailerVariantPrices) when creating retailer or later edit.
- Admin can invite retailer via email (optional invite flow).

## Key services
- cart.service.ts
- price.service.ts (calls /api/prices/effective)
- checkout.service.ts
- orders.service.ts
- referral.service.ts
- wishlist.service.ts
- admin.service.ts (add retailer methods: createRetailer, listRetailers, updateRetailer)

## Performance recommendations
- Lazy-load admin and retailer modules.
- Route-level code splitting; production build (`ng build --prod`).
- Serve static files via CDN with long cache TTL and fingerprinted filenames.
- Use Angular Service Worker for caching assets and faster repeat loads.
- Minimize third-party libs; defer analytics/admin scripts.
- Use HTTP/2 & Gzip/Brotli compression and responsive images.
