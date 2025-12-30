const express = require('express');
const router = express.Router();
const chatController = require('../../controllers/admin/Chatcontroller');
const reportsController = require('../../controllers/admin/Reportscontroller');
const analyticsController = require('../../controllers/admin/Analyticscontroller');
const { protectAdmin, isAdmin } = require('../../middleware/authMiddleware');
const { uploadChatMedia, handleUploadError } = require('../../middleware/uploadMiddleware');

// ==================== CHAT ROUTES ====================

// Chat Dashboard (list)
router.get(
    '/',
    protectAdmin,
    isAdmin,
    chatController.renderChatDashboard
);

// Single Conversation
router.get(
    '/:conversationId',
    protectAdmin,
    isAdmin,
    chatController.renderConversation
);

router.get(
    '/conversations',
    protectAdmin,
    isAdmin,
    chatController.getConversations
);
router.get(
    '/:conversationId/messages',
    protectAdmin,
    isAdmin,
    chatController.getMessages
);
router.post(
    '/send',
    protectAdmin,
    isAdmin,
    uploadChatMedia,
    handleUploadError,
    chatController.sendMessage
);

router.patch(
    "/message/:messageId/edit",
    protectAdmin,
    isAdmin,
    chatController.editMessage
)

router.delete(
    "/message/:messageId",
    protectAdmin,
    isAdmin,
    chatController.deleteMessage
)


// router.patch('/chat/:conversationId/read', protectAdmin, isAdmin, chatController.markAsRead);
// router.get('/chat/unread-count', protectAdmin, isAdmin, chatController.getUnreadCount);

// ==================== REPORTS ROUTES ====================

// Delivery Reports
router.get('/reports/deliveries', protectAdmin, isAdmin, reportsController.getDeliveryReport);

// Customer Reports
router.get('/reports/customers', protectAdmin, isAdmin, reportsController.getCustomerReport);

// Vehicle Reports
router.get('/reports/vehicles', protectAdmin, isAdmin, reportsController.getVehicleReport);

// Maintenance Reports
router.get('/reports/maintenance', protectAdmin, isAdmin, reportsController.getMaintenanceReport);

// Fuel Expense Reports
router.get('/reports/fuel-expenses', protectAdmin, isAdmin, reportsController.getFuelExpenseReport);

// Driver Performance Reports
router.get('/reports/driver-performance', protectAdmin, isAdmin, reportsController.getDriverPerformanceReport);

// On-time vs Delayed Reports
router.get('/reports/punctuality', protectAdmin, isAdmin, reportsController.getOnTimeDelayedReport);

// Region Distribution Reports
router.get('/reports/region-distribution', protectAdmin, isAdmin, reportsController.getRegionDistributionReport);

// Export Reports
router.get('/reports/export/excel', protectAdmin, isAdmin, reportsController.exportToExcel);
router.get('/reports/export/pdf', protectAdmin, isAdmin, reportsController.exportToPDF);

// ==================== ANALYTICS ROUTES ====================

// Fuel Analytics
router.get('/analytics/fuel', protectAdmin, isAdmin, analyticsController.getFuelAnalytics);

// Punctuality Metrics
router.get('/analytics/punctuality', protectAdmin, isAdmin, analyticsController.getPunctualityMetrics);

// Driver Performance Scoring
router.get('/analytics/driver-score', protectAdmin, isAdmin, analyticsController.getDriverPerformanceScore);

// Dashboard KPIs
router.get('/analytics/kpis', protectAdmin, isAdmin, analyticsController.getDashboardKPIs);

module.exports = router;

