const orderRepo = require('../repositories/orderRepo');
const cartRepo = require('../repositories/cartRepo');

async function createOrderFromCart({ userId, retailerId, shippingAddressId, cartItems, paymentGatewayOrderId, paymentGatewayPaymentId }) {
  // Calculate total amount from cart items
  const totalAmount = cartItems.reduce((total, item) => {
    return total + (Number(item.Price) * Number(item.Qty));
  }, 0);

  // Create order
  const order = await orderRepo.createOrder({
    userId,
    retailerId,
    shippingAddressId,
    totalAmount,
    status: 'CONFIRMED',
    paymentStatus: 'PAID'
  });

  // Add order items
  for (const item of cartItems) {
    await orderRepo.createOrderItem({
      orderId: order.Id,
      productId: item.ProductId,
      variantId: item.VariantId,
      qty: item.Qty,
      price: item.Price
    });
  }

  // Update order with payment gateway references if needed
  if (paymentGatewayOrderId || paymentGatewayPaymentId) {
    await orderRepo.updateOrderPaymentReferences(order.Id, paymentGatewayOrderId, paymentGatewayPaymentId);
  }

  return order;
}

async function createFailedOrder({ userId, paymentGatewayOrderId, paymentGatewayPaymentId, status, paymentStatus }) {
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