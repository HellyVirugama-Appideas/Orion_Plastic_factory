const express = require('express');
const router = express.Router();
const customerController = require('../../controllers/admin/customerController');
const { isAdmin, protectAdmin } = require('../../middleware/authMiddleware');
const { checkPermission } = require('../../middleware/roleMiddleware');
const multer = require('multer');
const path = require('path');

// Configure multer for CSV upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/csv/');
  },
  filename: (req, file, cb) => {
    cb(null, `customers_import_${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

//  CUSTOMER CRUD 

// Create customer
router.post(
  '/',
  protectAdmin,
  isAdmin,
  checkPermission('customers', 'create'),
  customerController.createCustomer
);

// Get all customers
router.get(
  '/',
  protectAdmin,
  isAdmin,
  checkPermission('customers', 'read'),
  customerController.getAllCustomers
);

// Get customer by ID
router.get(
  '/:customerId',
  protectAdmin,
  isAdmin,
  checkPermission('customers', 'read'),
  customerController.getCustomerById
);

// Update customer
router.put(
  '/:customerId',
  protectAdmin,
  isAdmin,
  checkPermission('customers', 'update'),
  customerController.updateCustomer
);

// Delete customer
router.delete(
  '/:customerId',
  protectAdmin,
  isAdmin,
  checkPermission('customers', 'delete'),
  customerController.deleteCustomer
);

//  LOCATION MANAGEMENT 

// Add location
router.post(
  '/:customerId/locations',
  protectAdmin,
  isAdmin,
  checkPermission('customers', 'update'),
  customerController.addLocation
);

// Update location
router.put(
  '/:customerId/locations/:locationId',
  protectAdmin,
  isAdmin,
  checkPermission('customers', 'update'),
  customerController.updateLocation
);

// Delete location
router.delete(
  '/:customerId/locations/:locationId',
  protectAdmin,
  isAdmin,
  checkPermission('customers', 'delete'),
  customerController.deleteLocation
);

// Override region for location
router.patch(
  '/:customerId/locations/:locationId/override-region',
  protectAdmin,
  isAdmin,
  checkPermission('customers', 'update'),
  customerController.overrideRegion
);

//  PREFERENCES 

// Toggle feedback notification
router.patch(
  '/:customerId/toggle-feedback',
  protectAdmin,
  isAdmin,
  checkPermission('customers', 'update'),
  customerController.toggleFeedbackNotification
);

// Update preferences
router.patch(
  '/:customerId/preferences',
  protectAdmin,
  isAdmin,
  checkPermission('customers', 'update'),
  customerController.updatePreferences
);

//  BULK OPERATIONS 

// Bulk import (CSV)
router.post(
  '/bulk/import',
  protectAdmin,
  isAdmin,
  checkPermission('customers', 'create'),
  upload.single('csvFile'),
  customerController.bulkImport
);

// Bulk export (CSV)
router.get(
  '/bulk/export',
  protectAdmin,
  isAdmin,
  checkPermission('customers', 'read'),
  customerController.bulkExport
);

//  STATISTICS 

// Get customer statistics
router.get(
  '/stats/overview',
  protectAdmin,
  isAdmin,
  checkPermission('customers', 'read'),
  customerController.getCustomerStatistics
);

module.exports = router;