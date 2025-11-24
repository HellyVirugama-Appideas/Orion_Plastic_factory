const express = require('express');
const router = express.Router();
const vehicleController = require('../../controllers/admin/vehicleController');
const { isAdmin, protectAdmin } = require('../../middleware/authMiddleware');
const { checkPermission } = require('../../middleware/roleMiddleware');


// Create vehicle
router.post(
  '/',
  protectAdmin,
  checkPermission('vehicles', 'create'),
  vehicleController.createVehicle
);

// Get all vehicles
router.get(
  '/',
  protectAdmin,
  isAdmin,
  checkPermission('vehicles', 'read'),
  vehicleController.getAllVehicles
);

// Get vehicle by ID
router.get(
  '/:vehicleId',
  protectAdmin,
  isAdmin,
  checkPermission('vehicles', 'read'),
  vehicleController.getVehicleById
);

// Update vehicle
router.put(
  '/:vehicleId',
  protectAdmin,
  isAdmin,
  checkPermission('vehicles', 'update'),
  vehicleController.updateVehicle
);

// Delete vehicle
router.delete(
  '/:vehicleId',
  protectAdmin,
  isAdmin,
  checkPermission('vehicles', 'delete'),
  vehicleController.deleteVehicle
);

// Update meter reading
router.patch(
  '/:vehicleId/meter-reading',
  protectAdmin,
  isAdmin,
  checkPermission('vehicles', 'update'),
  vehicleController.updateMeterReading
);

//  MAINTENANCE 

// Add maintenance record
router.post(
  '/:vehicleId/maintenance',
  protectAdmin,
  isAdmin,
  checkPermission('vehicles', 'update'),
  vehicleController.addMaintenanceRecord
);

// Get maintenance history
router.get(
  '/:vehicleId/maintenance',
  protectAdmin,
  isAdmin,
  checkPermission('vehicles', 'read'),
  vehicleController.getMaintenanceHistory
);


// Assign vehicle to driver
router.post(
  '/:vehicleId/assign',
  protectAdmin,
  isAdmin,
  checkPermission('vehicles', 'update'),
  vehicleController.assignVehicleToDriver
);

// Unassign vehicle from driver
router.post(
  '/:vehicleId/unassign',
  protectAdmin,
  isAdmin,
  checkPermission('vehicles', 'update'),
  vehicleController.unassignVehicleFromDriver
);

//  STATUS MANAGEMENT 

// Update vehicle status
router.patch(
  '/:vehicleId/status',
  protectAdmin,
  isAdmin,
  checkPermission('vehicles', 'update'),
  vehicleController.updateVehicleStatus
);

//  STATISTICS 

// Get vehicle statistics
router.get(
  '/stats/overview',
  protectAdmin,
  isAdmin,
  checkPermission('vehicles', 'read'),
  vehicleController.getVehicleStatistics
);

module.exports = router;