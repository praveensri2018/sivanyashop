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

module.exports = { adjustStock, getStockLedger, getProductStock };
