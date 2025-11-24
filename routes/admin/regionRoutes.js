const express = require('express');
const router = express.Router();
const regionController = require('../../controllers/admin/regionController');
const { isAdmin, protectAdmin } = require('../../middleware/authMiddleware');
const { checkPermission } = require('../../middleware/roleMiddleware');


// Create region
router.post(
  '/',
  protectAdmin,
  isAdmin,
  checkPermission('regions', 'create'),
  regionController.createRegion
);

// Get all regions
router.get(
  '/',
  protectAdmin,
  isAdmin,
  checkPermission('regions', 'read'),
  regionController.getAllRegions
);

// Get region by ID
router.get(
  '/:regionId',
  protectAdmin,
  isAdmin,
  checkPermission('regions', 'read'),
  regionController.getRegionById
);

// Update region
router.put(
  '/:regionId',
  protectAdmin,
  isAdmin,
  checkPermission('regions', 'update'),
  regionController.updateRegion
);

// Delete region
router.delete(
  '/:regionId',
  protectAdmin,
  isAdmin,
  checkPermission('regions', 'delete'),
  regionController.deleteRegion
);

//  ZIPCODE MANAGEMENT 

// Add zipcode to region
router.post(
  '/:regionId/zipcodes',
  protectAdmin,
  isAdmin,
  checkPermission('regions', 'update'),
  regionController.addZipcode
);

// Remove zipcode from region
router.delete(
  '/:regionId/zipcodes/:zipcode',
  protectAdmin,
  isAdmin,
  checkPermission('regions', 'delete'),
  regionController.removeZipcode
);

// Find region by zipcode
router.get(
  '/zipcode/:zipcode',
  protectAdmin,
  isAdmin,
  checkPermission('regions', 'read'),
  regionController.findRegionByZipcode
);

//  STATISTICS 

// Get region statistics
router.get(
  '/stats/overview',
  protectAdmin,
  isAdmin,
  checkPermission('regions', 'read'),
  regionController.getRegionStatistics
);

module.exports = router;