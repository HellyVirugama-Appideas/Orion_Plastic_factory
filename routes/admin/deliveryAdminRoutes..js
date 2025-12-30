// const express = require('express');
// const router = express.Router();
// const {  protectAdmin, isAdmin } = require('../../middleware/authMiddleware');
// const { checkPermission } = require('../../middleware/roleMiddleware');
// const { createDelivery, assignDriver, assignMultipleDeliveries, getAllDeliveries, getDeliveryDetails, trackDelivery, renderCreateDelivery, captureHiddenScreenshot, renderDeliveriesList } = require('../../controllers/admin/deliveryAdminController');
 
// // Admin Routes
// router.get('/',protectAdmin,isAdmin , renderDeliveriesList);
// router.get('/deliveries_create',protectAdmin,isAdmin, renderCreateDelivery);
 
// router.post( 
//   '/',  
//   protectAdmin,
//   isAdmin,
//   checkPermission('deliveries', 'create'),
//  createDelivery
// );

// router.patch(
//   '/:deliveryId/assign-driver',
//   protectAdmin,
//   isAdmin,
//   checkPermission('deliveries', 'update'),
//   assignDriver
// );

// router.post(
//   '/assign-multiple',
//   protectAdmin,
//   isAdmin,
//   checkPermission('deliveries', 'update'),
//   assignMultipleDeliveries
// );

// // router.get(
// //   '/',
// //   protectAdmin,
// //   isAdmin,
// //   checkPermission('deliveries', 'read'), 
// //   getAllDeliveries
// // );

// // router.get(
// //   '/:deliveryId',
// //   protectAdmin,
// //   isAdmin,
// //   getDeliveryDetails
// // );
// // router.get(
// //   '/track/:trackingNumber',
// //   protectAdmin,
// //   isAdmin,
// //   trackDelivery
// // );

// // router.post(
// //   "/jouney/:journeyId/hidden-screenshot",
// //   protectAdmin,
// //   isAdmin,
// //   captureHiddenScreenshot
// // )

// module.exports = router;

const express = require('express');
const router = express.Router();
const { protectAdmin, isAdmin } = require('../../middleware/authMiddleware');
const { checkPermission } = require('../../middleware/roleMiddleware');
const deliveryController = require('../../controllers/admin/deliveryAdminController');

// ============= PAGE ROUTES =============

// Deliveries list
router.get(
  '/',
  protectAdmin,
  isAdmin,
  checkPermission('deliveries', 'read'),
  deliveryController.renderDeliveriesList
);

// Create delivery from order page
router.get(
  '/create-from-order/:orderId',
  protectAdmin,
  isAdmin,
  checkPermission('deliveries', 'create'),
  deliveryController.renderCreateDeliveryFromOrder
);

// Delivery details
router.get(
  '/:deliveryId',
  protectAdmin,
  isAdmin,
  checkPermission('deliveries', 'read'),
  deliveryController.renderDeliveryDetails
);

// ============= POST/PATCH ACTIONS =============

// Create delivery from order
router.post(
  '/create-from-order/:orderId',
  protectAdmin,
  isAdmin,
  checkPermission('deliveries', 'create'),
  deliveryController.createDeliveryFromOrder
);

// Update delivery status
router.patch(
  '/:deliveryId/status',
  protectAdmin,
  isAdmin,
  checkPermission('deliveries', 'update'),
  deliveryController.updateDeliveryStatus
);

// Complete waypoint
router.patch(
  '/:deliveryId/waypoint/:waypointIndex/complete',
  protectAdmin,
  isAdmin,
  checkPermission('deliveries', 'update'),
  deliveryController.completeWaypoint
);

// Submit delivery proof
router.post(
  '/:deliveryId/submit-proof',
  protectAdmin,
  isAdmin,
  checkPermission('deliveries', 'update'),
  deliveryController.submitDeliveryProof
);

// Add remark
router.post(
  '/:deliveryId/remarks',
  protectAdmin,
  isAdmin,
  checkPermission('deliveries', 'update'),
  deliveryController.addDeliveryRemark
);

// ============= API ENDPOINTS =============

// Get live driver location
router.get(
  '/:deliveryId/live-location',
  protectAdmin,
  isAdmin,
  deliveryController.getDriverLiveLocation
);

module.exports = router;