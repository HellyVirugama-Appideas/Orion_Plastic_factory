const express = require('express');
const router = express.Router();
const orderController = require('../../controllers/orderController');
const { protectAdmin, isAdmin } = require('../../middleware/authMiddleware');
const { checkPermission } = require('../../middleware/roleMiddleware');
const { createOrderByAdmin } = require('../../controllers/admin/orderController');
const { renderOrdersList, renderCreateOrder } = require('../../controllers/admin/adminDashboardController');

 
// Admin creates order
// router.post(
//   '/create',
//   protectAdmin, 
//   isAdmin,
//   checkPermission('orders', 'create'),
//   orderController.createOrderByAdmin
// );

router.get('/orders', renderOrdersList);
router.get('/orders/create', renderCreateOrder);

router.post("/create",protectAdmin,isAdmin,createOrderByAdmin)

// Get all orders
// router.get(
//   '/all',
//   protectAdmin, 
//   isAdmin,
//   checkPermission('orders', 'read'),
//   orderController.getAllOrders
// );

// Confirm order
router.patch(
  '/:orderId/confirm',
  protectAdmin,
  isAdmin,
  checkPermission('orders', 'update'),
  orderController.confirmOrder
);

// Update order status
router.patch(
  '/:orderId/status',
  protectAdmin,
  isAdmin,
  checkPermission('orders', 'update'),
  orderController.updateOrderStatus
);



module.exports = router;