const express = require('express');
const router = express.Router();
const remarkController = require('../../controllers/admin/remarkAdminController');
const { isAdmin, protectAdmin } = require('../../middleware/authMiddleware');

//  PREDEFINED REMARKS (ADMIN) 
// Create predefined remark (Admin only)
router.post(
  '/predefined',
  protectAdmin,
  isAdmin,
  remarkController.createPredefinedRemark
);

// Update predefined remark (Admin only)
router.put(
  '/predefined/:remarkId',
  protectAdmin,
  isAdmin,
  remarkController.updatePredefinedRemark
);

// Delete predefined remark (Admin only - soft delete)
router.delete(
  '/predefined/:remarkId',
  protectAdmin,
  isAdmin,
  remarkController.deletePredefinedRemark
);


//  ADMIN APPROVAL FOR CUSTOM REMARKS 

// Get pending custom remarks (Admin)
router.get(
  '/custom/pending',
  protectAdmin,
  isAdmin,
  remarkController.getPendingCustomRemarks
);

// Approve custom remark (Admin)
router.post(
  '/custom/:remarkId/approve',
  protectAdmin,
  isAdmin,
  remarkController.approveCustomRemark
);

// Reject custom remark (Admin)
router.post(
  '/custom/:remarkId/reject',
  protectAdmin,
  isAdmin,
  remarkController.rejectCustomRemark
);

// Get remark statistics (Admin)
router.get(
  '/analytics/statistics',
  protectAdmin,
  isAdmin,
  remarkController.getRemarkStatistics
);

module.exports = router;

