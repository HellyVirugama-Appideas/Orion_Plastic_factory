const express = require('express');
const router = express.Router();
const { protectAdmin, isAdmin } = require('../../middleware/authMiddleware');
const { getLiveLocation, getRouteHistory, trackDeliveryProgress, getFleetView, getFinalLocationProof, getDriverLocation, deleteOldTrackingLogs } = require('../../controllers/admin/AdminTrackingcontroller');


router.get(
  '/live-location/:deliveryId',
  protectAdmin,
  isAdmin,
  getLiveLocation
);

router.get(
  '/route-history/:deliveryId',
  protectAdmin,
  isAdmin,
  getRouteHistory
);

router.get(
  '/progress/:deliveryId',
  protectAdmin,
  isAdmin,
  trackDeliveryProgress
);

router.get(
  '/fleet-view',
  protectAdmin,
  isAdmin,
  getFleetView
);

router.get(
  '/final-location/:deliveryId',
  protectAdmin,
  isAdmin,
  getFinalLocationProof
);

router.get(
  '/driver/:driverId/location',
  protectAdmin,
  isAdmin,
  getDriverLocation
);

router.delete(
  '/cleanup',
  protectAdmin,
  isAdmin,
  deleteOldTrackingLogs
);

module.exports = router;