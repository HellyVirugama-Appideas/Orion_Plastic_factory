const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticate, isAdmin, isCustomer } = require('../middleware/authMiddleware');
const { checkPermission } = require('../middleware/roleMiddleware');

// ======================== CUSTOMER ROUTES ========================

// Customer creates order
router.post(
  '/',
  authenticate,
  isCustomer,
  orderController.createOrder
);

// Get customer's orders
router.get(
  '/my-orders',
  authenticate,
  isCustomer,
  orderController.getMyOrders
);

// Get single order details
router.get(
  '/:orderId',
  authenticate,
  orderController.getOrderDetails
);

// Update order (only if pending)
router.put(
  '/:orderId',
  authenticate,
  orderController.updateOrder
);

// Cancel order
router.patch(
  '/:orderId/cancel',
  authenticate,
  orderController.cancelOrder
);

// ======================== ADMIN ROUTES ========================

// Admin creates order
router.post(
  '/admin/create',
  authenticate,
  isAdmin,
  checkPermission('orders', 'create'),
  orderController.createOrderByAdmin
);

// Get all orders
router.get(
  '/admin/all',
  authenticate,
  isAdmin,
  checkPermission('orders', 'read'),
  orderController.getAllOrders
);

// Confirm order
router.patch(
  '/:orderId/confirm',
  authenticate,
  isAdmin,
  checkPermission('orders', 'update'),
  orderController.confirmOrder
);

// Update order status
router.patch(
  '/:orderId/status',
  authenticate,
  isAdmin,
  checkPermission('orders', 'update'),
  orderController.updateOrderStatus
);

// Create delivery from order
router.post(
  '/:orderId/create-delivery',
  authenticate,
  isAdmin,
  checkPermission('deliveries', 'create'),
  orderController.createDeliveryFromOrder
);

// Update payment status
router.patch(
  '/:orderId/payment',
  authenticate,
  isAdmin,
  checkPermission('orders', 'update'),
  orderController.updatePaymentStatus
);

// Get order statistics
router.get(
  '/admin/statistics',
  authenticate,
  isAdmin,
  checkPermission('orders', 'read'),
  orderController.getOrderStatistics
);

module.exports = router;