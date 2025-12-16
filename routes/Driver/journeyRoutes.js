// const express = require('express');
// const router = express.Router();
// const journeyController = require('../../controllers/driver/journeyController');
// const { authenticateDriver, isDriver } = require('../../middleware/authMiddleware');
// const { 
//   uploadJourneyImage, 
//   uploadSignature, 
//   handleUploadError,
//   requireFile
// } = require('../../middleware/uploadMiddleware');

// // ======================== JOURNEY MANAGEMENT ========================

// // Start journey
// router.post('/start', authenticateDriver, isDriver, journeyController.startJourney);

// // End journey
// router.patch('/:journeyId/end', authenticateDriver, isDriver, journeyController.endJourney);

// // Add waypoint
// router.post('/:journeyId/waypoint', authenticateDriver, isDriver, journeyController.addWaypoint);

// // Add journey image
// router.post(
//   '/:journeyId/image',
//   authenticateDriver,
//   isDriver,
//   uploadJourneyImage,
//   handleUploadError,
//   requireFile('image'),
//   journeyController.addJourneyImage
// );

// // Upload customer signature
// router.post(
//   '/signature/:deliveryId',
//   authenticateDriver,
//   isDriver,
//   uploadSignature,
//   handleUploadError,
//   requireFile('signature'),
//   journeyController.uploadSignature
// );

// // Get journey details
// router.get('/:journeyId', authenticateDriver, journeyController.getJourneyDetails);

// // Get journey by delivery
// router.get('/delivery/:deliveryId', authenticateDriver, journeyController.getJourneyByDelivery);

// // Get driver journey history
// router.get('/driver/history', authenticateDriver, isDriver, journeyController.getDriverJourneyHistory);

// module.exports = router; 


const express = require("express")
const { startJourney, addCheckpoint, addJourneyImage, endJourney, getActiveJourney, getJourneyDetails, getDriverJourneyHistory } = require("../../controllers/Driver/journeyController")
const {authenticateDriver,isDriver} = require("../../middleware/authMiddleware")
const { uploadJourneyImage, handleUploadError, uploadSignature } = require("../../middleware/uploadMiddleware")

const router = express.Router()

router.post(
  "/start",
  authenticateDriver,
  isDriver,
  startJourney
)

router.post(
  "/:journeyId/checkpoint",
  authenticateDriver,
  isDriver,
  addCheckpoint
)

router.post(
  "/:journeyId/image",
  authenticateDriver,
  isDriver,
  uploadJourneyImage,
  handleUploadError,
  addJourneyImage
)

router.post(
  "/signature/:deliveryId",
  authenticateDriver,
  isDriver,
  uploadSignature,
  handleUploadError,
  uploadSignature
)

router.patch(
  "/:journeyId/end",
  authenticateDriver,
  isDriver,
  endJourney
)

router.get(
  "/active",
  authenticateDriver,
  isDriver,
  getActiveJourney
)

router.get(
  "/:journeyId",
  authenticateDriver,
  isDriver,
  getJourneyDetails
)

router.get(
  "/history",
  authenticateDriver,
  isDriver,
  getDriverJourneyHistory
)

module.exports = router



