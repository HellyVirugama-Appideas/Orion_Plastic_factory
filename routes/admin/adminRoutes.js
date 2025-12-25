const express = require('express');
const router = express.Router();
const adminAuthController = require('../../controllers/admin/adminAuthController');
const adminDashboardController = require('../../controllers/admin/adminDashboardController');
const documentVerificationController = require('../../controllers/admin/documentVerificationController');
const { protectAdmin, isAdmin } = require('../../middleware/authMiddleware');
const { checkPermission } = require('../../middleware/roleMiddleware');
const { validateEmail, validatePassword, validateRequiredFields } = require('../../middleware/validator');


// ========== Admin Authentication Routes ==========
router.get('/signin', adminAuthController.renderLogin);

router.post(
  '/signup',
  validateRequiredFields(['name', 'email', 'phone', 'password']),
  validateEmail,
  validatePassword,
  adminAuthController.adminSignup
);

router.post(
  '/signin',
  validateRequiredFields(['email', 'password']),
  validateEmail,
  adminAuthController.adminSignin
);


// Dashboard
router.get('/',protectAdmin,isAdmin, adminDashboardController.renderDashboard);
// router.get('/', (req, res) => res.redirect('/admin/dashboard'));

router.get('/profile', protectAdmin,  adminAuthController.getAdminProfile);

router.put('/profile', protectAdmin,  adminAuthController.updateAdminProfile);

router.post("/logout",protectAdmin,adminAuthController.adminLogout)

router.post("/logout/all",protectAdmin,adminAuthController.adminLogoutAll)

// ========== Dashboard Routes ==========
// router.get('/dashboard/stats', protectAdmin,  adminDashboardController.getDashboardStats);
router.get('/dashboard', protectAdmin, adminDashboardController.renderDashboard);

// // ========== User Management Routes ==========
// router.get(
//   '/users',
//   protectAdmin,
//   checkPermission('users', 'read'),
//   adminDashboardController.getAllUsers
// );

// router.get(
//   '/users/:userId',
//   protectAdmin,
//   checkPermission('users', 'read'),
//   adminDashboardController.getUserDetails
// );

// router.patch(
//   '/users/:userId/toggle-status',
//   protectAdmin,
//   checkPermission('users', 'update'),
//   adminDashboardController.toggleUserStatus
// );

// router.delete(
//   '/users/:userId',
//   protectAdmin,
//   checkPermission('users', 'delete'),
//   adminDashboardController.deleteUser
// );

// ========== Driver Management Routes ==========

// router.get('/drivers/create', driverController.renderCreateDriver);

// router.get(
//   '/drivers',
//   protectAdmin,
//   checkPermission('drivers', 'read'),
//   adminDashboardController.getAllDrivers
// );

router.get(
  '/drivers/:driverId/documents',
  protectAdmin,
  checkPermission('documents', 'read'),
  documentVerificationController.getDriverDocuments
);

router.patch(
  '/drivers/:driverId/approve',
  protectAdmin,
  checkPermission('drivers', 'approve'),
  documentVerificationController.approveDriverProfile
);

router.patch(
  '/drivers/:driverId/reject',
  protectAdmin,
  
  checkPermission('drivers', 'reject'),
  validateRequiredFields(['rejectionReason']),
  documentVerificationController.rejectDriverProfile
);

// ========== Document Verification Routes ==========
router.get(
  '/documents',
  protectAdmin,
  
  checkPermission('documents', 'read'),
  documentVerificationController.getAllDocuments
);

router.get(
  '/documents/pending',
  protectAdmin,
  
  checkPermission('documents', 'read'),
  documentVerificationController.getPendingDocuments
);

router.get(
  '/documents/:documentId',
  protectAdmin,
  
  checkPermission('documents', 'read'),
  documentVerificationController.getDocumentDetails
);

router.patch(
  '/documents/:documentId/verify',
  protectAdmin,
  
  checkPermission('documents', 'approve'),
  documentVerificationController.verifyDocument
);

router.patch(
  '/documents/:documentId/reject',
  protectAdmin,
  
  checkPermission('documents', 'reject'),
  validateRequiredFields(['rejectionReason']),
  documentVerificationController.rejectDocument
);


module.exports = router;