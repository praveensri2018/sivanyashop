const stockRepo = require('../repositories/stockRepo');

async function adjustStock({ productId, variantId, quantity, movementType }) {
  // Update StockLedger
  await stockRepo.insertStockLedger({ productId, variantId, quantity, movementType });
  return { productId, variantId, quantity, movementType };
}

async function getStockLedger() {
  return stockRepo.fetchStockLedger();
}

async function getProductStock(productId) {
  return stockRepo.fetchProductStock(productId);
}

async function createInitialStockLedger({ productId, variantId, initialStock = 0, movementType = 'ADD' }) {
  await stockRepo.insertStockLedger({ 
    productId, 
    variantId, 
    quantity: initialStock, 
    movementType 
  });
  console.log(`📦 Stock ledger created: Product ${productId}, Variant ${variantId}, Qty: ${initialStock}`);
}

async function checkAvailability(items = []) {
  const results = [];

  for (const it of items) {
    const productId = Number(it.productId);
    const variantId = it.variantId == null ? null : Number(it.variantId);
    const requestedQty = Number(it.qty || 0);

    // Fetch variants/stock for product
    const variants = await stockRepo.fetchProductStock(productId);
    // variants rows shape (from repo): { VariantId, VariantName, StockQty }

    if (!variants || variants.length === 0) {
      // no variants => treat as product-level out of stock
      results.push({
        productId,
        variantId,
        requestedQty,
        availableQty: 0,
        available: false,
        reason: 'product_not_found_or_no_variants'
      });
      continue;
    }

    if (variantId == null) {
      // if no variantId provided, try to sum all stocks or treat first variant:
      // Here, we'll sum all variant stocks and compare
      const totalStock = variants.reduce((s, v) => s + Number(v.StockQty || 0), 0);
      results.push({
        productId,
        variantId: null,
        requestedQty,
        availableQty: totalStock,
        available: totalStock >= requestedQty
      });
    } else {
      const match = variants.find(v => Number(v.VariantId) === variantId);
      const availableQty = match ? Number(match.StockQty || 0) : 0;
      results.push({
        productId,
        variantId,
        requestedQty,
        availableQty,
        available: availableQty >= requestedQty,
        reason: match ? undefined : 'variant_not_found'
      });
    }
  }

  return results;
}

module.exports = { adjustStock, getStockLedger, getProductStock ,createInitialStockLedger,
  checkAvailability };
