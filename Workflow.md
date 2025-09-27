# Workflow (Admin creates retailer + full order flow)

1. Registration & Referral
- Customer registers and may enter retailer referral code.
- System links Customer -> Retailer.

2. Admin creates retailer
- Admin fills retailer form (name, email, optional phone/address, initial wholesale defaults, sendInvite flag).
- Backend creates Users row with Role='RETAILER', generates ReferralCode, inserts optional address/profile, and optional RetailerVariantPrices.
- If sendInvite=true, system sends invite email with referral code/invite link.

3. Product & Price Setup (Admin)
- Admin creates products and variants.
- Admin sets CustomerPrice and WholesalePrice per variant (WholesalePrice can be per-retailer or default).
- Admin may set suggested RetailerSellingPrice.

4. Retailer Price Setup
- Retailer may set RetailerSellingPrice per variant (optional).
- If not set, retailer-linked customers use CustomerPrice.
- No per-customer special rates.

5. Browse & Add to Cart
- Customer browses catalog; EffectivePrice resolved (RetailerSellingPrice if linked and exists, else CustomerPrice).
- Customer adds product to cart (Cart & CartItems store unit price at add time).

6. Checkout & Payment
- Customer creates order; Orders & OrderItems created (PENDING).
- Customer pays via gateway; Payments recorded.
- On successful payment, settlement runs.

7. Settlement
- Direct customer: admin receives CustomerPrice × qty.
- Retailer customer: customer pays RetailerSellingPrice (or CustomerPrice if none); admin receives WholesalePrice × qty; retailer receives margin = CustomerPaid − WholesaleTotal.

8. Ledger & Stock
- FinancialLedger entries written (Admin revenue, Retailer margin, optional customer payment).
- Stock decremented and recorded in StockLedger.

9. Order Status & History
- Order lifecycle: PENDING → CONFIRMED/PROCESSING → SHIPPED → DELIVERED/CANCELLED/REFUNDED.
- Admin updates status; Retailer & Customer can view status and order history.

10. Payouts / Retailer Settlement
- Admin can create manual payout for retailer with FromDate/ToDate; payout processed and status updated.
- Payouts recorded in Payouts table and FinancialLedger as needed.

11. Price Changes & Versioning
- Price change = deactivate old row (IsActive=0, EffectiveTo=now) and insert new active row (IsActive=1, EffectiveFrom=now).

12. Example
- Admin: CustomerPrice=500, WholesalePrice=300.
- Direct sale: customer pays 500 → admin earns 500.
- Retailer sale (selling price 400): customer pays 400 → admin earns 300, retailer earns 100.
