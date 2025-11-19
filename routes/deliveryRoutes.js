const express = require('express');
const router = express.Router();
const deliveryController = require('../controllers/deliveryController');
const { authenticateDriver, protectAdmin, isAdmin, isDriver } = require('../middleware/authMiddleware');
const { checkPermission } = require('../middleware/roleMiddleware');

// Admin Routes
router.post(
  '/',
  protectAdmin,
  isAdmin,
  checkPermission('deliveries', 'create'),
  deliveryController.createDelivery
);

router.patch(
  '/:deliveryId/assign-driver',
  protectAdmin,
  isAdmin,
  checkPermission('deliveries', 'update'),
  deliveryController.assignDriver
);

router.post(
  '/assign-multiple',
  protectAdmin,
  isAdmin,
  checkPermission('deliveries', 'update'),
  deliveryController.assignMultipleDeliveries
);

router.get(
  '/',
  protectAdmin,
  isAdmin,
  checkPermission('deliveries', 'read'),
  deliveryController.getAllDeliveries
);

router.get(
  '/:deliveryId',
  authenticateDriver,
  deliveryController.getDeliveryDetails
);

// Driver Routes
router.get(
  '/driver/my-deliveries',
  authenticateDriver,
  isDriver,
  deliveryController.getDriverDeliveries
);

router.patch(
  '/:deliveryId/status',
  authenticateDriver,
  isDriver,
  deliveryController.updateDeliveryStatus
);

router.post(
  '/:deliveryId/generate-otp',
  authenticateDriver,
  isDriver,
  deliveryController.generateDeliveryOTP
);

router.post(
  '/:deliveryId/verify-otp',
  authenticateDriver,
  isDriver,
  deliveryController.verifyOTPAndComplete
);

// Public Route (Tracking)
router.get(
  '/track/:trackingNumber',
  deliveryController.trackDelivery
);

module.exports = router;