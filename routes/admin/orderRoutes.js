// const express = require('express');
// const router = express.Router();
// const orderController = require('../../controllers/orderController');
// const { protectAdmin, isAdmin } = require('../../middleware/authMiddleware');
// const { checkPermission } = require('../../middleware/roleMiddleware');
// const { createOrderByAdmin } = require('../../controllers/admin/orderController');
// const { renderOrdersList, renderCreateOrder } = require('../../controllers/admin/adminDashboardController');

 
// // Admin creates order
// // router.post(
// //   '/create',
// //   protectAdmin, 
// //   isAdmin,
// //   checkPermission('orders', 'create'),
// //   orderController.createOrderByAdmin
// // );

// router.get('/orders', renderOrdersList);
// router.get('/orders/create', renderCreateOrder);

// router.post("/create",protectAdmin,isAdmin,createOrderByAdmin)

// // Get all orders
// // router.get(
// //   '/all',
// //   protectAdmin, 
// //   isAdmin,
// //   checkPermission('orders', 'read'),
// //   orderController.getAllOrders
// // );

// // Confirm order
// router.patch(
//   '/:orderId/confirm',
//   protectAdmin,
//   isAdmin,
//   checkPermission('orders', 'update'),
//   orderController.confirmOrder
// );

// // Update order status
// router.patch(
//   '/:orderId/status',
//   protectAdmin,
//   isAdmin,
//   checkPermission('orders', 'update'),
//   orderController.updateOrderStatus
// );



// module.exports = router;

const express = require('express');
const router = express.Router();
const orderController = require('../../controllers/orderController');
const adminDashboardController = require('../../controllers/admin/orderController');
const { protectAdmin, isAdmin } = require('../../middleware/authMiddleware');
const { checkPermission } = require('../../middleware/roleMiddleware');

// ============= PAGE ROUTES =============

// Orders list page
router.get(
  '/',
  protectAdmin,
  isAdmin,
  checkPermission('orders', 'read'),
  adminDashboardController.renderOrdersList
);

// Create order page
router.get(
  '/create',
  protectAdmin,
  isAdmin,
  checkPermission('orders', 'create'),
  adminDashboardController.renderCreateOrder
);

// Order details page (MUST be after /create to avoid route conflicts)
router.get(
  '/view/:orderId',
  protectAdmin,
  isAdmin,
  checkPermission('orders', 'read'),
  adminDashboardController.renderOrderDetails
);



// Edit order page
router.get(
  '/edit/:orderId',
  protectAdmin,
  isAdmin,
  checkPermission('orders', 'update'),
  adminDashboardController.renderEditOrder
);

// Create delivery from order page
router.get(
  '/:orderId/create-delivery',
  protectAdmin,
  isAdmin,
  checkPermission('deliveries', 'create'),
  adminDashboardController.renderCreateDeliveryFromOrder
);

// ============= POST/PATCH ACTIONS =============

// Create order (from orderController)
router.post(
  '/create',
  protectAdmin,
  isAdmin,
  checkPermission('orders', 'create'),
  adminDashboardController.createOrder
);

// Update order
router.put(
  '/edit/:orderId',
  protectAdmin,
  isAdmin,
  checkPermission('orders', 'update'),
  adminDashboardController.updateOrder
);


/// delete order
router.delete(
  "/:orderId",
  protectAdmin,
  isAdmin,
  adminDashboardController.deleteOrder
)

// Confirm order
router.patch(
  '/:orderId/confirm',
  protectAdmin,
  isAdmin,
  checkPermission('orders', 'update'),
  adminDashboardController.confirmOrder
);

// Update order status
router.patch(
  '/:orderId/status',
  protectAdmin,
  isAdmin,
  checkPermission('orders', 'update'),
  orderController.updateOrderStatus
);

// Create delivery from order (API endpoint)
router.post(
  '/:orderId/create-delivery',
  protectAdmin,
  isAdmin,
  checkPermission('deliveries', 'create'),
  orderController.createDeliveryFromOrder
);

// ============= API ENDPOINTS =============

// Get order statistics
router.get(
  '/stats/overview',
  protectAdmin,
  isAdmin,
  checkPermission('orders', 'read'),
  adminDashboardController.getOrderStatistics
);

// Get all orders (API)
router.get(
  '/all',
  protectAdmin,
  isAdmin,
  checkPermission('orders', 'read'),
  orderController.getAllOrders
);

// Get single order (API)
router.get(
  '/:orderId',
  protectAdmin,
  isAdmin,
  checkPermission('orders', 'read'),
  orderController.getOrderDetails
);

module.exports = router;