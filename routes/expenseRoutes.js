const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const { uploadExpenseReceipts, handleUploadError } = require('../middleware/uploadMiddleware');
const { authenticateDriver, isDriver } = require('../middleware/authMiddleware');

//  DRIVER EXPENSE ROUTES 

// Create fuel expense
router.post(
    '/fuel',
    authenticateDriver,
    isDriver,
    expenseController.createFuelExpense
);

// Upload receipts and meter photos
router.post(    
    '/:expenseId/receipts',
    authenticateDriver,
    isDriver,
    uploadExpenseReceipts,
    handleUploadError,
    expenseController.uploadReceipts
);

// Get my expenses
router.get(
    '/my-expenses',
    authenticateDriver,
    isDriver,
    expenseController.getMyExpenses
);

// Get expense by ID
router.get(
    '/:expenseId',
    authenticateDriver,
    isDriver,
    expenseController.getExpenseById
);

// Calculate my mileage
router.get(
    '/mileage/calculate',
    authenticateDriver,
    isDriver,
    expenseController.calculateMyMileage
);

// Get my expense summary
router.get(
    '/summary/stats',
    authenticateDriver,
    isDriver,
    expenseController.getMyExpenseSummary
);

// Update expense (only if pending or rejected)
router.put(
    '/:expenseId',
    authenticateDriver,
    isDriver,
    expenseController.updateExpense
);

// Delete expense (only if pending)
router.delete(
    '/:expenseId',
    authenticateDriver,
    isDriver,
    expenseController.deleteExpense
);

module.exports = router;