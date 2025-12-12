// const express = require('express');
// const router = express.Router();
// const journeyController = require('../controllers/journeyController');
// const { authenticateDriver, isDriver } = require('../middleware/authMiddleware');
// const { journeyUpload, signatureUpload } = require('../config/multer');
// const { handleUploadError } = require('../middleware/uploadMiddleware');

// // Start/End Journey
// router.post(
//   '/start',
//   authenticateDriver,
//   isDriver,
//   journeyController.startJourney
// );

// router.patch(
//   '/:journeyId/end',
//   authenticateDriver,
//   isDriver,
//   journeyController.endJourney
// );

// // Waypoints
// router.post(
//   '/:journeyId/waypoint',
//   authenticateDriver,
//   isDriver,
//   journeyController.addWaypoint
// );

// // Journey Images
// router.post(
//   '/:journeyId/image',
//   authenticateDriver,
//   isDriver,
//   journeyUpload.single('image'),
//   handleUploadError,
//   journeyController.addJourneyImage
// );

// // Customer Signature
// router.post(
//   '/signature/:deliveryId',
//   authenticateDriver,
//   isDriver,
//   signatureUpload.single('signature'),
//   handleUploadError,
//   journeyController.uploadSignature
// );

// // Get Journey Details
// router.get(
//   '/:journeyId',
//   authenticateDriver,
//   journeyController.getJourneyDetails
// );

// router.get(
//   '/delivery/:deliveryId',
//   authenticateDriver,
//   journeyController.getJourneyByDelivery
// );

// router.get(
//   '/driver/history',
//   authenticateDriver,
//   isDriver,
//   journeyController.getDriverJourneyHistory
// );

// module.exports = router;

const express = require('express');
const router = express.Router();
const journeyController = require('../../controllers/driver/journeyController');
const { authenticateDriver, isDriver } = require('../../middleware/authMiddleware');
const { 
  uploadJourneyImage, 
  uploadSignature, 
  handleUploadError,
  requireFile
} = require('../../middleware/uploadMiddleware');

// ======================== JOURNEY MANAGEMENT ========================

// Start journey
router.post('/start', authenticateDriver, isDriver, journeyController.startJourney);

// End journey
router.patch('/:journeyId/end', authenticateDriver, isDriver, journeyController.endJourney);

// Add waypoint
router.post('/:journeyId/waypoint', authenticateDriver, isDriver, journeyController.addWaypoint);

// Add journey image
router.post(
  '/:journeyId/image',
  authenticateDriver,
  isDriver,
  uploadJourneyImage,
  handleUploadError,
  requireFile('image'),
  journeyController.addJourneyImage
);

// Upload customer signature
router.post(
  '/signature/:deliveryId',
  authenticateDriver,
  isDriver,
  uploadSignature,
  handleUploadError,
  requireFile('signature'),
  journeyController.uploadSignature
);

// Get journey details
router.get('/:journeyId', authenticateDriver, journeyController.getJourneyDetails);

// Get journey by delivery
router.get('/delivery/:deliveryId', authenticateDriver, journeyController.getJourneyByDelivery);

// Get driver journey history
router.get('/driver/history', authenticateDriver, isDriver, journeyController.getDriverJourneyHistory);

module.exports = router; 