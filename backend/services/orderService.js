// Place file at: backend/services/orderService.js
// Full order service layer. Uses orderRepo + cartRepo. Defensive total calc + logging.

const orderRepo = require('../repositories/orderRepo');
const cartRepo = require('../repositories/cartRepo');

async function createOrderFromCart({ userId, retailerId, shippingAddressId, cartItems = [], paymentGatewayOrderId, paymentGatewayPaymentId }) {
  // Defensive: ensure cartItems is array
  const items = Array.isArray(cartItems) ? cartItems : [];

  // Calculate total amount defensively
  const totalAmount = items.reduce((total, item) => {
    const price = Number(item.Price ?? item.price ?? 0);
    const qty = Number(item.Qty ?? item.qty ?? 1);
    return total + (price * qty);
  }, 0);

  // ensure we pass a JS Number with 2 decimal places
  const totalToSend = Number(totalAmount.toFixed(2));

  // Create order - MAKE SURE THIS RETURNS THE CREATED ORDER
  const order = await orderRepo.createOrder({
    userId,
    retailerId: retailerId || null,
    shippingAddressId: shippingAddressId || null,
    totalAmount: totalToSend,
    status: 'CONFIRMED',
    paymentStatus: 'PAID'
  });

  // Safety check
  if (!order || !order.Id) {
    throw new Error('Order repository did not return order with Id');
  }

  // Add order items
  for (const item of items) {
    await orderRepo.createOrderItem({
      orderId: order.Id,
      productId: item.ProductId ?? item.productId,
      variantId: item.VariantId ?? item.variantId,
      qty: item.Qty ?? item.qty ?? 1,
      price: item.Price ?? item.price ?? 0
    });
  }

  // Update order with payment gateway references if needed
  if (paymentGatewayOrderId || paymentGatewayPaymentId) {
    await orderRepo.updateOrderPaymentReferences(order.Id, paymentGatewayOrderId, paymentGatewayPaymentId);
  }

  // Return created order object
  return order;
}

async function createFailedOrder({ userId, paymentGatewayOrderId, paymentGatewayPaymentId, status = 'FAILED', paymentStatus = 'FAILED' }) {
  const order = await orderRepo.createOrder({
    userId,
    totalAmount: 0,
    status,
    paymentStatus
  });

  if (paymentGatewayOrderId || paymentGatewayPaymentId) {
    await orderRepo.updateOrderPaymentReferences(order.Id, paymentGatewayOrderId, paymentGatewayPaymentId);
  }

  return order;
}

async function createPaymentRecord({ orderId, amount, method, paymentGateway, transactionRef, status }) {
  return await orderRepo.createPayment({
    orderId,
    amount,
    method,
    paymentGateway,
    transactionRef,
    status
  });
}

async function updateStockForOrder(orderId) {
  const orderItems = await orderRepo.getOrderItems(orderId);
  
  for (const item of orderItems) {
    // Update stock ledger for each item
    await orderRepo.createStockLedgerEntry({
      productId: item.ProductId,
      variantId: item.VariantId,
      refOrderId: orderId,
      refOrderItemId: item.Id,
      movementType: 'SALE',
      quantity: -item.Qty // Negative because stock is reducing
    });

    // Update product variant stock quantity
    await orderRepo.updateVariantStock(item.VariantId, -item.Qty);
  }
}

async function clearUserCart(userId) {
  const cart = await cartRepo.getCartByUserId(userId);
  if (cart) {
    await orderRepo.clearCartItems(cart.Id);
  }
}

module.exports = {
  createOrderFromCart,
  createFailedOrder,
  createPaymentRecord,
  updateStockForOrder,
  clearUserCart
};
