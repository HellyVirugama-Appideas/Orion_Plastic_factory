const express = require('express');
const router = express.Router();
const trackingController = require('../controllers/trackingController');
const { authenticateDriver, isDriver, isAdmin } = require('../middleware/authMiddleware');

// Driver Routes
router.post(
  '/update-location',
  authenticateDriver,
  isDriver,
  trackingController.updateLocation
);

// Public/Customer Routes
router.get(
  '/current/:deliveryId',
  trackingController.getCurrentLocation
);

router.get(
  '/progress/:deliveryId',
  trackingController.trackDeliveryProgress
);

router.get(
  '/route/:deliveryId',
  trackingController.getRouteRecording
);

// Admin Routes
router.get(
  '/history/:deliveryId',
  authenticateDriver,
  isAdmin,
  trackingController.getTrackingHistory
);

router.delete(
  '/cleanup',
  authenticateDriver,
  isAdmin,
  trackingController.deleteOldTrackingLogs
);

module.exports = router;