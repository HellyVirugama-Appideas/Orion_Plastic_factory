// const express = require('express');
// const router = express.Router();
// const driverController = require('../controllers/driverController');
// const { authenticateDriver, isDriver } = require('../middleware/authMiddleware');
// const { validateEmail, validatePhone, validatePassword, validatePin, validateRequiredFields } = require('../middleware/validator');

// // Driver Signup/Signin
// router.post(
//   '/signup',
//   validateRequiredFields(['name', 'email', 'phone', 'password', 'licenseNumber', 'vehicleType', 'vehicleNumber', 'pin']),
//   validateEmail,
//   validatePhone,
//   validatePassword,
//   validatePin,
//   driverController.driverSignup
// );

// router.post(
//   '/signin',
//   validateRequiredFields(['email', 'password']),
//   validateEmail,
//   driverController.driverSignin
// );

// // PIN Management (Protected Routes)
// router.post(
//   '/validate-pin',
//   authenticateDriver,
//   isDriver,
//   validateRequiredFields(['pin']),
//   validatePin,
//   driverController.validatePin
// );

// router.post(
//   '/change-pin',
//   authenticateDriver,
//   isDriver,
//   validateRequiredFields(['currentPin', 'newPin']),
//   validatePin,
//   driverController.changePin
// );

// router.post(
//   '/forgot-pin',
//   validateRequiredFields(['phone']),
//   validatePhone,
//   driverController.forgotPin
// );

// router.post(
//   '/reset-pin',
//   validateRequiredFields(['phone', 'resetToken', 'newPin']),
//   validatePhone,
//   validatePin,
//   driverController.resetPin
// );

// // Driver Profile
// router.get('/profile', authenticateDriver, isDriver, driverController.getDriverProfile);

// // Availability Toggle
// router.patch('/toggle-availability', authenticateDriver, isDriver, driverController.toggleAvailability);

// module.exports = router;


const express = require('express');
const router = express.Router();
const driverController = require('../controllers/driverController');
const { authenticateDriver, isDriver } = require('../middleware/authMiddleware');
const { 
  validateEmail, 
  validatePhone, 
  validatePassword, 
  validatePin,
  validateChangePin,  // NEW
  validateResetPin,   // NEW
  validateRequiredFields 
} = require('../middleware/validator');

// Driver Signup/Signin
router.post(
  '/signup',
  validateRequiredFields(['name', 'email', 'phone', 'password', 'licenseNumber', 'vehicleType', 'vehicleNumber', 'pin']),
  validateEmail,
  validatePhone,
  validatePassword,
  validatePin,
  driverController.driverSignup
);

router.post(
  '/signin',
  validateRequiredFields(['email', 'password']),
  validateEmail,
  driverController.driverSignin
);

// PIN Management (Protected Routes)
router.post(
  '/validate-pin',
  authenticateDriver,
  isDriver,
  validateRequiredFields(['pin']),
  validatePin,
  driverController.validatePin
);

router.post(
  '/change-pin',
  authenticateDriver,
  isDriver,
  validateChangePin,  // CHANGED: Use validateChangePin instead of validatePin
  driverController.changePin
);

router.post(
  '/forgot-pin',
  validateRequiredFields(['phone']),
  validatePhone,
  driverController.forgotPin
);

router.post(
  '/reset-pin',
  validateResetPin,  // CHANGED: Use validateResetPin
  driverController.resetPin
);

// Driver Profile
router.get('/profile', authenticateDriver, isDriver, driverController.getDriverProfile);

// Availability Toggle
router.patch('/toggle-availability', authenticateDriver, isDriver, driverController.toggleAvailability);

module.exports = router;


