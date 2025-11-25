const express = require('express');
const router = express.Router();
const expenseController = require('../../controllers/admin/expenseAdminController');
const { protectAdmin, isAdmin } = require('../../middleware/authMiddleware');

//  ADMIN EXPENSE ROUTES 

// Get all expenses with filters
router.get( 
  '/',
  protectAdmin,
  isAdmin,
  expenseController.getAllExpenses
);

// Get expense by ID
router.get(
  '/:expenseId',
  protectAdmin,
  isAdmin,
  expenseController.getExpenseById
);

// Get pending expenses
router.get(
  '/pending/list',
  protectAdmin,
  isAdmin,
  expenseController.getPendingExpenses
);

// Approve expense (Admin level)
router.post(
  '/:expenseId/approve',
  protectAdmin,
  isAdmin,
  expenseController.approveExpense
);

// Reject expense
router.post(
  '/:expenseId/reject',
  protectAdmin,
  isAdmin,
  expenseController.rejectExpense
);

// Get expense reports
router.get(
  '/reports/summary',
  protectAdmin,
  isAdmin,
  expenseController.getExpenseReports
);

// Get expense analytics
router.get(
  '/analytics/summary',
  protectAdmin,
  isAdmin,
  expenseController.getExpenseAnalytics
);

// Export expenses
router.get(
  '/export/data',
  protectAdmin,
  isAdmin,
  expenseController.exportExpenses
);

module.exports = router;