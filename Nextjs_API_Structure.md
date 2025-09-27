# Next.js Backend - API-only Structure (Lightweight, Fast)

## Goals
- API-only backend for auth, pricing, checkout, settlement, reports.
- Keep small, stateless handlers with DB pooling and caching.
- No SSR; serve Angular static assets from CDN.

## Project layout (API routes)
/pages
  /api
    /auth
      login.ts
      register.ts
      me.ts
    /referrals
      redeem.ts
    /products
      index.ts
      [id].ts
    /prices
      effective.ts
    /cart
      get.ts
      add-item.ts
      update-item.ts
      remove-item.ts
    /checkout
      create-order.ts
      payment-webhook.ts
    /orders
      index.ts
      [id].ts
      settle.ts
    /retailer
      prices.ts
      payouts.ts
    /admin
      products.ts
      prices.ts
      orders.ts
      retailers.ts        # add retailer CRUD endpoints
      reports
        finance.ts
/lib
  db.ts                # connection pool
  auth.ts              # jwt helpers & role checks
  price-resolver.ts    # central price resolution logic
  settlement.ts        # order settlement logic (calls stored-proc)
/middleware
  auth.ts              # parse jwt & attach user
/utils
  validators.ts
  logger.ts

## Admin: retailer endpoints
- POST /api/admin/retailers -> create retailer (Role='RETAILER', generate ReferralCode, optional invite)
- GET /api/admin/retailers -> list retailers
- GET /api/admin/retailers/[id] -> get retailer
- PUT /api/admin/retailers/[id] -> update retailer
- POST /api/admin/retailers/[id]/deactivate -> deactivate retailer

## Key endpoints
- GET /api/prices/effective?variantId= -> resolves price for logged-in user.
- POST /api/cart/add-item -> add item to cart; returns updated cart.
- POST /api/checkout/create-order -> create order & return payment intent.
- POST /api/checkout/payment-webhook -> handle gateway events; call settlement.
- GET /api/orders -> list orders (RBAC filtered).
- PUT /api/admin/orders/[id] -> update order status (admin only).
- POST /api/admin/payouts -> create manual payout for retailer settlement.

## Performance & deployment
- Deploy as serverless functions or a small Node service.
- Use DB connection pooling strategies suitable for serverless (or a dedicated pool server).
- Cache price lookups in Redis with short TTL; invalidate on price change.
- Keep handlers atomic and idempotent (especially webhooks).
