# Angular Frontend - Customer-First Structure (Fast, Minimal)

## Goals
- Customer pages prioritized in initial bundle for fastest UX.
- Lazy-load admin and retailer modules.
- Small initial bundle, defer heavy components and admin code.
- Use HTTP caching, service worker, and CDN for static assets.

## Project layout (customer-first)
/src
  /app
    /core
      auth.service.ts
      api.service.ts
      cache.service.ts
      guards/
      interceptors/
    /shared
      components/
      directives/
      pipes/
      models/
    /features
      /home
        home.component.ts
      /catalog
        catalog.component.ts
        product-card.component.ts
      /product
        product-detail.component.ts
      /customer
        customer.module.ts
        customer-routing.module.ts
        /browse
          browse.component.ts
        /product
          quick-view.component.ts
        /cart
          cart.component.ts
          mini-cart.component.ts
          checkout.component.ts
          checkout-summary.component.ts
        /account
          profile.component.ts
          addresses.component.ts
          payments.component.ts
          referrals.component.ts
        /orders
          orders-list.component.ts
          order-detail.component.ts
        /wishlist
          wishlist.component.ts
        /notifications
          notifications.component.ts
      /auth
        login.component.ts
        register.component.ts
        redeem-referral.component.ts
    /admin (lazy)
      admin-dashboard.component.ts
      products/
        product-list.component.ts
        product-edit.component.ts
      pricing/
        pricing-list.component.ts
        pricing-edit.component.ts
      orders/
        orders.component.ts
        order-detail.component.ts
      reports/
        finance-report.component.ts
      retailers/
        admin-retailers.component.ts
        retailer-edit.component.ts
        retailer-invite-modal.component.ts
    /retailer (lazy)
      retailer-dashboard.component.ts
      my-prices.component.ts
      orders.component.ts
      payouts.component.ts
    app-routing.module.ts
    app.module.ts
  main.ts
  styles.scss

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
