const express = require('express');
const router = express.Router();
const driverManagementController = require('../../controllers/admin/driverManagementController');
const { checkPermission } = require('../../middleware/roleMiddleware');
const { protectAdmin,isAdmin } = require('../../middleware/authMiddleware');


// Get all drivers with filters
router.get(
  '/',
  protectAdmin,
  isAdmin,
  checkPermission('drivers', 'read'),
  driverManagementController.getAllDrivers
);

// Block driver
router.post(
  '/:driverId/block',
  protectAdmin,
  isAdmin,
  checkPermission('drivers', 'update'),
  driverManagementController.blockDriver
);

// Unblock driver
router.post(
  '/:driverId/unblock',
  protectAdmin,
  isAdmin,
  checkPermission('drivers', 'update'),
  driverManagementController.unblockDriver
);
router.get("/:driverId",protectAdmin,isAdmin, driverManagementController.getDriverDetails)


// Update driver details
router.put(
  '/:driverId',
  protectAdmin,
  isAdmin,
  checkPermission('drivers', 'update'),
  driverManagementController.updateDriverDetails
);

// Update bank details
router.patch(
  '/:driverId/bank-details',
  protectAdmin,
  isAdmin,
  checkPermission('drivers', 'update'),
  driverManagementController.updateBankDetails
);

// Get driver performance
router.get(
  '/:driverId/performance',
  protectAdmin,
  isAdmin,
  checkPermission('drivers', 'read'),
  driverManagementController.getDriverPerformance
);


// Get driver statistics
router.get(
  '/stats/overview',
  protectAdmin,
  isAdmin,
  checkPermission('drivers', 'read'),
  driverManagementController.getDriverStatistics
);

module.exports = router;