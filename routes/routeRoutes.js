const express = require('express');
const router = express.Router();
const routeController = require('../controllers/routeController');
const { authenticate, isAdmin, isDriver } = require('../middleware/authMiddleware');
const { checkPermission } = require('../middleware/roleMiddleware');

// Admin Routes
router.post(
  '/',
  authenticate,
  isAdmin,
  checkPermission('routes', 'create'),
  routeController.createRoute
);

router.patch(
  '/:routeId/auto-arrange',
  authenticate,
  isAdmin,
  checkPermission('routes', 'update'),
  routeController.autoArrangeRoute
);

router.patch(
  '/:routeId/manual-arrange',
  authenticate,
  isAdmin,
  checkPermission('routes', 'update'),
  routeController.manualArrangeRoute
);

router.get(
  '/',
  authenticate,
  isAdmin,
  checkPermission('routes', 'read'),
  routeController.getAllRoutes
);

router.get(
  '/:routeId',
  authenticate,
  routeController.getRouteDetails
);

router.delete(
  '/:routeId',
  authenticate,
  isAdmin,
  checkPermission('routes', 'delete'),
  routeController.deleteRoute
);

// Driver Routes
router.get(
  '/driver/active',
  authenticate,
  isDriver,
  routeController.getDriverActiveRoutes
);

router.patch(
  '/:routeId/start',
  authenticate,
  isDriver,
  routeController.startRoute
);

router.patch(
  '/:routeId/complete',
  authenticate,
  isDriver,
  routeController.completeRoute
);

module.exports = router;