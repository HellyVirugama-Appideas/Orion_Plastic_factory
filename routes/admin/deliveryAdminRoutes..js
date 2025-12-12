const express = require('express');
const router = express.Router();
const {  protectAdmin, isAdmin } = require('../../middleware/authMiddleware');
const { checkPermission } = require('../../middleware/roleMiddleware');
const { createDelivery, assignDriver, assignMultipleDeliveries, getAllDeliveries, getDeliveryDetails, trackDelivery, renderCreateDelivery } = require('../../controllers/admin/deliveryAdminController');
const { renderDeliveriesList } = require('../../controllers/admin/adminDashboardController');

// Admin Routes
router.get('/deliveries',protectAdmin,isAdmin , renderDeliveriesList);
router.get('/deliveries/create',protectAdmin,isAdmin, renderCreateDelivery);

router.post(
  '/',
  protectAdmin,
  isAdmin,
  checkPermission('deliveries', 'create'),
 createDelivery
);

router.patch(
  '/:deliveryId/assign-driver',
  protectAdmin,
  isAdmin,
  checkPermission('deliveries', 'update'),
  assignDriver
);

router.post(
  '/assign-multiple',
  protectAdmin,
  isAdmin,
  checkPermission('deliveries', 'update'),
  assignMultipleDeliveries
);

router.get(
  '/',
  protectAdmin,
  isAdmin,
  checkPermission('deliveries', 'read'), 
  getAllDeliveries
);

router.get(
  '/:deliveryId',
  protectAdmin,
  isAdmin,
  getDeliveryDetails
);
router.get(
  '/track/:trackingNumber',
  protectAdmin,
  isAdmin,
  trackDelivery
);

module.exports = router;