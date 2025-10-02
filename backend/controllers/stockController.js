const stockService = require('../services/stockService');

async function adjustStock(req, res, next) {
  try {
    const { productId, variantId, quantity, movementType } = req.body;
    const result = await stockService.adjustStock({ productId, variantId, quantity, movementType });
    res.json({ success: true, stock: result });
  } catch (err) {
    next(err);
  }
}

async function getStockLedger(req, res, next) {
  try {
    const ledger = await stockService.getStockLedger();
    res.json({ success: true, ledger });
  } catch (err) {
    next(err);
  }
}

async function getProductStock(req, res, next) {
  try {
    const productId = parseInt(req.params.productId);
    const stock = await stockService.getProductStock(productId);
    res.json({ success: true, stock });
  } catch (err) {
    next(err);
  }
}

module.exports = { adjustStock, getStockLedger, getProductStock };
