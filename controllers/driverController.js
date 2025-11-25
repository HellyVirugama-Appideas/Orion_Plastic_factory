// const User = require('../models/User');
// const Driver = require('../models/Driver');
// const Session = require('../models/Session');
// const RefreshToken = require('../models/RefreshToken');
// const jwtHelper = require('../utils/jwtHelper');
// const { hashPin, validatePin, isValidPinFormat, generateResetToken } = require('../utils/pinHelper');
// const { sendWelcomeEmail } = require('../utils/emailHelper');
// const { sendPinResetSMS } = require('../utils/smsHelper');
// const { successResponse, errorResponse } = require('../utils/responseHelper');
// const mongoose = require('mongoose');
// const bcrypt = require('bcryptjs');

// exports.driverSignup = async (req, res) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     const {
//       name, email, phone, password,
//       licenseNumber, vehicleType, vehicleNumber,
//       vehicleModel, vehicleColor, pin
//     } = req.body;

//     // Validate PIN
//     if (!pin || !/^\d{4}$/.test(pin)) {
//       return errorResponse(res, 'PIN must be exactly 4 digits', 400);
//     }

//     // Validate password length
//     if (!password || password.length < 6) {
//       return errorResponse(res, 'Password must be at least 6 characters', 400);
//     }

//     // Check if driver already exists (email, phone, license, vehicle)
//     const exists = await Driver.findOne({
//       $or: [
//         { email },
//         { phone },
//         { licenseNumber },
//         { vehicleNumber: vehicleNumber?.toUpperCase() }
//       ]
//     });

//     if (exists) {
//       return errorResponse(res, 'Email, phone, license or vehicle already registered', 400);
//     }

//     // Hash password aur PIN
//     const hashedPassword = await bcrypt.hash(password, 10);
//     const hashedPin = await bcrypt.hash(pin, 10);

//     // SIRF DRIVER CREATE KARO — User mat banao!
//     const driver = await Driver.create([{
//       name,
//       email: email.toLowerCase(),
//       phone,
//       password: hashedPassword,
//       role: 'driver',

//       licenseNumber,
//       vehicleType,
//       vehicleNumber: vehicleNumber.toUpperCase(),
//       vehicleModel: vehicleModel || '',
//       vehicleColor: vehicleColor || '',
//       pin: hashedPin,

//       profileStatus: 'pending_verification',
//       isActive: true
//     }], { session });

//     // Generate tokens (driver._id use karo)
//     const accessToken = jwtHelper.generateAccessToken(driver[0]._id, 'driver');
//     const refreshToken = jwtHelper.generateRefreshToken(driver[0]._id);
//     const expiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

//     await RefreshToken.create([{
//       userId: driver[0]._id,
//       token: refreshToken,
//       expiresAt: expiry
//     }], { session });

//     await Session.create([{
//       userId: driver[0]._id,
//       token: accessToken,
//       deviceInfo: req.headers['user-agent'] || 'Unknown',
//       ipAddress: req.ip,
//       expiresAt: expiry
//     }], { session });

//     await session.commitTransaction();

//     // Email bhejo
//     sendWelcomeEmail(email, name).catch(console.error);

//     return successResponse(res, 'Driver registered successfully!', {
//       driver: {
//         id: driver[0]._id,
//         name: driver[0].name,
//         email: driver[0].email,
//         phone: driver[0].phone,
//         profileStatus: driver[0].profileStatus
//       },
//       accessToken,
//       refreshToken
//     }, 201);

//   } catch (error) {
//     await session.abortTransaction();
//     console.error('Driver Signup Error:', error);

//     if (error.code === 11000) {
//       return errorResponse(res, 'Email, phone, license or vehicle already exists', 400);
//     }
//     if (error.name === 'ValidationError') {
//       const msg = Object.values(error.errors)[0]?.message || 'Invalid data';
//       return errorResponse(res, msg, 400);
//     }

//     return errorResponse(res, 'Registration failed', 500);
//   } finally {
//     session.endSession();
//   }
// };

// exports.driverSignin = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     // Basic validation
//     if (!email || !password) {
//       return errorResponse(res, 'Email and password are required', 400);
//     }

//     // Sirf Driver collection mein dhundo (User ko chhodo bilkul)
//     const driver = await Driver.findOne({
//       email: email.toLowerCase()
//     }).select('+password'); // +password because we excluded it in toJSON

//     // Agar driver nahi mila
//     if (!driver) {
//       return errorResponse(res, 'Invalid email or password', 401);
//     }

//     // Account deactivated?
//     if (!driver.isActive) {
//       return errorResponse(res, 'Your account has been deactivated. Contact support.', 403);
//     }

//     // Password check
//     const isPasswordValid = await driver.comparePassword(password);
//     if (!isPasswordValid) {
//       return errorResponse(res, 'Invalid email or password', 401);
//     }

//     // Generate tokens (driver._id use karo, User ka nahi)
//     const accessToken = jwtHelper.generateAccessToken(driver._id, 'driver');
//     const refreshToken = jwtHelper.generateRefreshToken(driver._id);

//     const expiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

//     // Save tokens in Session & RefreshToken (userId = driver._id)
//     await RefreshToken.create({
//       userId: driver._id,
//       token: refreshToken,
//       expiresAt: expiry
//     });

//     await Session.create({
//       userId: driver._id,
//       token: accessToken,
//       deviceInfo: req.headers['user-agent'] || 'Unknown',
//       ipAddress: req.ip || 'Unknown',
//       userAgent: req.headers['user-agent'] || 'Unknown',
//       expiresAt: expiry
//     });

//     // Success response
//     return successResponse(res, 'Driver login successful', {
//       driver: {
//         id: driver._id,
//         name: driver.name,
//         email: driver.email,
//         phone: driver.phone,
//         role: driver.role,
//         profileStatus: driver.profileStatus,
//         isAvailable: driver.isAvailable,
//         isActive: driver.isActive,
//         vehicleType: driver.vehicleType,
//         vehicleNumber: driver.vehicleNumber,
//         profileImage: driver.profileImage || null
//       },
//       accessToken,
//       refreshToken
//     });

//   } catch (error) {
//     console.error('Driver Signin Error:', error);
//     return errorResponse(res, 'Login failed. Please try again.', 500);
//   }
// };

// //  Validate PIN - FIXED
// exports.validatePin = async (req, res) => {
//   try {
//     const { pin } = req.body;

//     if (!pin || !/^\d{4}$/.test(pin)) {
//       return errorResponse(res, 'PIN must be 4 digits', 400);
//     }

//     // YEHI SAHI HAI — direct driver._id se dhundo
//     const driver = await Driver.findById(req.user._id);

//     if (!driver) {
//       return errorResponse(res, 'Driver not found', 404);
//     }

//     if (!driver.isActive) {
//       return errorResponse(res, 'Account deactivated', 403);
//     }

//     // Lock check
//     if (driver.pinLockedUntil && driver.pinLockedUntil > new Date()) {
//       const mins = Math.ceil((driver.pinLockedUntil - new Date()) / 60000);
//       return errorResponse(res, `PIN locked. Try again in ${mins} minute(s)`, 423);
//     }

//     const isValid = await bcrypt.compare(pin, driver.pin);

//     if (!isValid) {
//       driver.pinAttempts = (driver.pinAttempts || 0) + 1;
//       if (driver.pinAttempts >= 3) {
//         driver.pinLockedUntil = new Date(Date.now() + 15 * 60 * 1000);
//         driver.pinAttempts = 0;
//       }
//       await driver.save();
//       return errorResponse(res, `Wrong PIN. ${3 - driver.pinAttempts} attempts left`, 401);
//     }

//     driver.pinAttempts = 0;
//     driver.pinLockedUntil = null;
//     await driver.save();

//     return successResponse(res, 'PIN validated successfully');

//   } catch (error) {
//     console.error('Validate PIN Error:', error);
//     return errorResponse(res, 'Validation failed', 500);
//   }
// };

// //  Change PIN - FIXED
// exports.changePin = async (req, res) => {
//   try {
//     const { currentPin, newPin } = req.body;

//     if (!currentPin || !newPin || currentPin === newPin) {
//       return errorResponse(res, 'Current & new PIN required and must be different', 400);
//     }

//     if (!/^\d{4}$/.test(newPin)) {
//       return errorResponse(res, 'New PIN must be 4 digits', 400);
//     }

//     const driver = await Driver.findById(req.user._id);
//     if (!driver) return errorResponse(res, 'Driver not found', 404);

//     if (driver.pinLockedUntil && driver.pinLockedUntil > new Date()) {
//       const mins = Math.ceil((driver.pinLockedUntil - new Date()) / 60000);
//       return errorResponse(res, `PIN locked. Try again in ${mins} minute(s)`, 423);
//     }

//     const isValid = await bcrypt.compare(currentPin, driver.pin);
//     if (!isValid) {
//       driver.pinAttempts = (driver.pinAttempts || 0) + 1;
//       if (driver.pinAttempts >= 3) {
//         driver.pinLockedUntil = new Date(Date.now() + 15 * 60 * 1000);
//         driver.pinAttempts = 0;
//       }
//       await driver.save();
//       return errorResponse(res, `Wrong current PIN. ${3 - driver.pinAttempts} attempts left`, 401);
//     }

//     driver.pin = await bcrypt.hash(newPin, 10);
//     driver.pinAttempts = 0;
//     driver.pinLockedUntil = null;
//     await driver.save();

//     return successResponse(res, 'PIN changed successfully');

//   } catch (error) {
//     console.error(error);
//     return errorResponse(res, 'Failed to change PIN', 500);
//   }
// };

// // Forgot PIN - FIXED (Sirf Driver se dhundo)
// exports.forgotPin = async (req, res) => {
//   try {
//     const { phone } = req.body;

//     if (!phone || !/^\d{10}$/.test(phone)) {
//       return errorResponse(res, 'Valid 10-digit phone required', 400);
//     }

//     const driver = await Driver.findOne({ phone });
//     if (!driver) {
//       return successResponse(res, 'If phone exists, you will receive a reset code');
//     }

//     const resetToken = Math.floor(100000 + Math.random() * 900000).toString();

//     driver.resetPinToken = resetToken;
//     driver.resetPinExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
//     await driver.save();

//     sendPinResetSMS(phone, resetToken).catch(console.error);

//     return successResponse(res, 'If phone exists, reset code sent');

//   } catch (error) {
//     console.error(error);
//     return errorResponse(res, 'Request failed', 500);
//   }
// };

// //  Reset PIN - FIXED
// exports.resetPin = async (req, res) => {
//   try {
//     const { phone, resetToken, newPin } = req.body;

//     if (!phone || !resetToken || !newPin) {
//       return errorResponse(res, 'All fields required', 400);
//     }

//     if (!/^\d{10}$/.test(phone) || !/^\d{4}$/.test(newPin)) {
//       return errorResponse(res, 'Invalid phone or PIN format', 400);
//     }

//     const driver = await Driver.findOne({
//       phone,
//       resetPinToken: resetToken,
//       resetPinExpires: { $gt: new Date() }
//     });

//     if (!driver) {
//       return errorResponse(res, 'Invalid or expired code', 400);
//     }

//     driver.pin = await bcrypt.hash(newPin, 10);
//     driver.resetPinToken = undefined;
//     driver.resetPinExpires = undefined;
//     driver.pinAttempts = 0;
//     driver.pinLockedUntil = null;
//     await driver.save();

//     return successResponse(res, 'PIN reset successful');

//   } catch (error) {
//     console.error(error);
//     return errorResponse(res, 'Reset failed', 500);
//   }
// };

// //  Get Profile 
// // controllers/profileController.js
// exports.getDriverProfile = async (req, res) => {
//   try {
//     const driver = await Driver.findById(req.user._id)
//       .select('-password -pin -resetPinToken -resetPinExpires'); // sensitive fields hata do

//     if (!driver) return errorResponse(res, 'Profile not found', 404);

//     return successResponse(res, 'Profile fetched successfully', {
//       driver: driver.toJSON(), // documents bhi include honge
//       totalDocuments: driver.documents.length,
//       profileStatus: driver.profileStatus
//     });

//   } catch (error) {
//     console.error(error);
//     return errorResponse(res, 'Failed to fetch profile', 500);
//   }
// };

// // 6. Toggle Availability 
// exports.toggleAvailability = async (req, res) => {
//   try {
//     const driver = await Driver.findById(req.user._id);
//     if (!driver) return errorResponse(res, 'Driver not found', 404);

//     if (driver.profileStatus !== 'approved') {
//       return errorResponse(res, 'Profile not approved yet', 403);
//     }

//     driver.isAvailable = !driver.isAvailable;
//     await driver.save();

//     return successResponse(res, `You are now ${driver.isAvailable ? 'online' : 'offline'}`, {
//       isAvailable: driver.isAvailable
//     });

//   } catch (error) {
//     console.error(error);
//     return errorResponse(res, 'Failed to update status', 500);
//   }
// };


const Driver = require('../models/Driver');
const Session = require('../models/Session');
const RefreshToken = require('../models/RefreshToken');
const jwtHelper = require('../utils/jwtHelper');
const { sendWelcomeEmail } = require('../utils/emailHelper');
const { sendPinResetSMS } = require('../utils/smsHelper');
const { successResponse, errorResponse } = require('../utils/responseHelper');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// DRIVER SIGNUP (WITHOUT VEHICLE DETAILS) 

exports.driverSignup = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      name,
      email,
      phone,
      password,
      licenseNumber,
      pin
    } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !password || !licenseNumber || !pin) {
      return errorResponse(res, 'All fields are required', 400);
    }

    // Validate PIN format (4 digits)
    if (!/^\d{4}$/.test(pin)) {
      return errorResponse(res, 'PIN must be exactly 4 digits', 400);
    }

    // Validate password length
    if (password.length < 6) {
      return errorResponse(res, 'Password must be at least 6 characters', 400);
    }

    // Check if driver already exists (email, phone, license)
    const existingDriver = await Driver.findOne({
      $or: [
        { email: email.toLowerCase() },
        { phone },
        { licenseNumber: licenseNumber.toUpperCase() }
      ]
    }); 

    if (existingDriver) {
      if (existingDriver.email === email.toLowerCase()) {
        return errorResponse(res, 'Email is already registered', 400);
      }
      if (existingDriver.phone === phone) {
        return errorResponse(res, 'Phone number is already registered', 400);
      }
      if (existingDriver.licenseNumber === licenseNumber.toUpperCase()) {
        return errorResponse(res, 'License number is already registered', 400);
      }
    }

    // Hash password and PIN
    const hashedPassword = await bcrypt.hash(password, 10);
    const hashedPin = await bcrypt.hash(pin, 10);

    // Create driver (WITHOUT vehicle details)
    const driver = await Driver.create([{
      name,
      email: email.toLowerCase(),
      phone,
      password: hashedPassword,
      licenseNumber: licenseNumber.toUpperCase(),
      pin: hashedPin,
      role: 'driver',
      profileStatus: 'incomplete', // Vehicle assignment pending
      isActive: true,
      isAvailable: false
    }], { session });

    // Generate tokens
    const accessToken = jwtHelper.generateAccessToken(driver[0]._id, 'driver');
    const refreshToken = jwtHelper.generateRefreshToken(driver[0]._id);
    const expiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Save refresh token
    await RefreshToken.create([{
      userId: driver[0]._id,
      token: refreshToken,
      expiresAt: expiry
    }], { session });

    // Save session
    await Session.create([{
      userId: driver[0]._id,
      token: accessToken,
      deviceInfo: req.headers['user-agent'] || 'Unknown',
      ipAddress: req.ip || 'Unknown',
      userAgent: req.headers['user-agent'] || 'Unknown',
      expiresAt: expiry
    }], { session });

    await session.commitTransaction();

    // Send welcome email (async)
    sendWelcomeEmail(email, name).catch(err => {
      console.error('Welcome Email Error:', err);
    });

    return successResponse(res, 'Driver registered successfully! Admin will assign vehicle.', {
      driver: {
        id: driver[0]._id,
        name: driver[0].name,
        email: driver[0].email,
        phone: driver[0].phone,
        licenseNumber: driver[0].licenseNumber,
        profileStatus: driver[0].profileStatus,
        isActive: driver[0].isActive,
        message: 'Vehicle will be assigned by admin. Please upload required documents.'
      },
      accessToken,
      refreshToken
    }, 201);

  } catch (error) {
    await session.abortTransaction();
    console.error('Driver Signup Error:', error);

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return errorResponse(res, `${field} already exists`, 400);
    }
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return errorResponse(res, messages.join(', '), 400);
    }

    return errorResponse(res, 'Registration failed. Please try again.', 500);
    
  } finally {
    session.endSession();
  }
};


exports.driverSignin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return errorResponse(res, 'Email and password are required', 400);
    }

    // Find driver by email
    const driver = await Driver.findOne({
      email: email.toLowerCase()
    }).select('+password');

    if (!driver) {
      return errorResponse(res, 'Invalid email or password', 401);
    }

    // Check if account is active
    if (!driver.isActive) {
      return errorResponse(res, 'Your account has been deactivated. Please contact support.', 403);
    }

    // Verify password
    const isPasswordValid = await driver.comparePassword(password);
    if (!isPasswordValid) {
      return errorResponse(res, 'Invalid email or password', 401);
    }

    // Generate tokens
    const accessToken = jwtHelper.generateAccessToken(driver._id, 'driver');
    const refreshToken = jwtHelper.generateRefreshToken(driver._id);
    const expiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Save tokens
    await RefreshToken.create({
      userId: driver._id,
      token: refreshToken,
      expiresAt: expiry
    });

    await Session.create({
      userId: driver._id,
      token: accessToken,
      deviceInfo: req.headers['user-agent'] || 'Unknown',
      ipAddress: req.ip || 'Unknown',
      userAgent: req.headers['user-agent'] || 'Unknown',
      expiresAt: expiry
    });

    // Success response
    return successResponse(res, 'Login successful', {
      driver: {
        id: driver._id,
        name: driver.name,
        email: driver.email,
        phone: driver.phone,
        licenseNumber: driver.licenseNumber,
        role: driver.role,
        profileStatus: driver.profileStatus,
        isAvailable: driver.isAvailable,
        isActive: driver.isActive,
        vehicleType: driver.vehicleType,
        vehicleNumber: driver.vehicleNumber,
        vehicleModel: driver.vehicleModel,
        vehicleAssigned: !!driver.vehicleNumber,
        profileImage: driver.profileImage,
        rating: driver.rating,
        totalRides: driver.totalRides
      },
      accessToken,
      refreshToken
    });

  } catch (error) {
    console.error('Driver Signin Error:', error);
    return errorResponse(res, 'Login failed. Please try again.', 500);
  }
};

// VALIDATE PIN 
exports.validatePin = async (req, res) => {
  try {
    const { pin } = req.body;

    if (!pin || !/^\d{4}$/.test(pin)) {
      return errorResponse(res, 'PIN must be 4 digits', 400);
    }

    const driver = await Driver.findById(req.user._id).select('+pin');

    if (!driver) {
      return errorResponse(res, 'Driver not found', 404);
    }

    if (!driver.isActive) {
      return errorResponse(res, 'Account is deactivated', 403);
    }

    // Check if PIN is locked
    if (driver.pinLockedUntil && driver.pinLockedUntil > new Date()) {
      const minutesLeft = Math.ceil((driver.pinLockedUntil - new Date()) / 60000);
      return errorResponse(res, `PIN is locked. Try again in ${minutesLeft} minute(s)`, 423);
    }

    // Verify PIN
    const isValid = await driver.comparePin(pin);

    if (!isValid) {
      driver.pinAttempts = (driver.pinAttempts || 0) + 1;
      
      // Lock PIN after 3 failed attempts
      if (driver.pinAttempts >= 3) {
        driver.pinLockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
        driver.pinAttempts = 0;
        await driver.save();
        return errorResponse(res, 'PIN locked due to multiple failed attempts. Try again in 15 minutes.', 423);
      }
      
      await driver.save();
      const attemptsLeft = 3 - driver.pinAttempts;
      return errorResponse(res, `Invalid PIN. ${attemptsLeft} attempt(s) remaining`, 401);
    }

    // Reset attempts on successful validation
    driver.pinAttempts = 0;
    driver.pinLockedUntil = null;
    await driver.save();

    return successResponse(res, 'PIN validated successfully', {
      validated: true
    });

  } catch (error) {
    console.error('Validate PIN Error:', error);
    return errorResponse(res, 'PIN validation failed', 500);
  }
};

// CHANGE PIN 
exports.changePin = async (req, res) => {
  try {
    const { currentPin, newPin } = req.body;

    if (!currentPin || !newPin) {
      return errorResponse(res, 'Current PIN and new PIN are required', 400);
    }

    if (currentPin === newPin) {
      return errorResponse(res, 'New PIN must be different from current PIN', 400);
    }

    if (!/^\d{4}$/.test(newPin)) {
      return errorResponse(res, 'New PIN must be 4 digits', 400);
    }

    const driver = await Driver.findById(req.user._id).select('+pin');
    
    if (!driver) {
      return errorResponse(res, 'Driver not found', 404);
    }

    // Check if PIN is locked
    if (driver.pinLockedUntil && driver.pinLockedUntil > new Date()) {
      const minutesLeft = Math.ceil((driver.pinLockedUntil - new Date()) / 60000);
      return errorResponse(res, `PIN is locked. Try again in ${minutesLeft} minute(s)`, 423);
    }

    // Verify current PIN
    const isValid = await driver.comparePin(currentPin);
    
    if (!isValid) {
      driver.pinAttempts = (driver.pinAttempts || 0) + 1;
      
      if (driver.pinAttempts >= 3) {
        driver.pinLockedUntil = new Date(Date.now() + 15 * 60 * 1000);
        driver.pinAttempts = 0;
        await driver.save();
        return errorResponse(res, 'PIN locked due to multiple failed attempts', 423);
      }
      
      await driver.save();
      const attemptsLeft = 3 - driver.pinAttempts;
      return errorResponse(res, `Invalid current PIN. ${attemptsLeft} attempt(s) remaining`, 401);
    }

    // Update PIN
    driver.pin = await bcrypt.hash(newPin, 10);
    driver.pinAttempts = 0;
    driver.pinLockedUntil = null;
    await driver.save();

    return successResponse(res, 'PIN changed successfully', {
      message: 'Your PIN has been updated. Please use the new PIN for future access.'
    });

  } catch (error) {
    console.error('Change PIN Error:', error);
    return errorResponse(res, 'Failed to change PIN', 500);
  }
};

// FORGOT PIN 
exports.forgotPin = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone || !/^\d{10}$/.test(phone)) {
      return errorResponse(res, 'Valid 10-digit phone number required', 400);
    }

    const driver = await Driver.findOne({ phone });
    
    if (!driver) {
      // Don't reveal if phone exists
      return successResponse(res, 'If your phone number exists in our system, you will receive a reset code', {
        message: 'Check your SMS for the PIN reset code'
      });
    }

    // Generate 6-digit reset token
    const resetToken = Math.floor(100000 + Math.random() * 900000).toString();

    driver.resetPinToken = resetToken;
    driver.resetPinExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await driver.save();

    // Send SMS (async)
    sendPinResetSMS(phone, resetToken).catch(err => {
      console.error('SMS Error:', err);
    });

    return successResponse(res, 'If your phone number exists in our system, you will receive a reset code', {
      message: 'Check your SMS for the PIN reset code'
    });

  } catch (error) {
    console.error('Forgot PIN Error:', error);
    return errorResponse(res, 'Request failed. Please try again.', 500);
  }
};

//  RESET PIN 
exports.resetPin = async (req, res) => {
  try {
    const { phone, resetToken, newPin } = req.body;

    if (!phone || !resetToken || !newPin) {
      return errorResponse(res, 'Phone number, reset token, and new PIN are required', 400);
    }

    if (!/^\d{10}$/.test(phone)) {
      return errorResponse(res, 'Invalid phone number format', 400);
    }

    if (!/^\d{4}$/.test(newPin)) {
      return errorResponse(res, 'New PIN must be 4 digits', 400);
    }

    const driver = await Driver.findOne({
      phone,
      resetPinToken: resetToken,
      resetPinExpires: { $gt: new Date() }
    });

    if (!driver) {
      return errorResponse(res, 'Invalid or expired reset code', 400);
    }

    // Update PIN
    driver.pin = await bcrypt.hash(newPin, 10);
    driver.resetPinToken = undefined;
    driver.resetPinExpires = undefined;
    driver.pinAttempts = 0;
    driver.pinLockedUntil = null;
    await driver.save();

    return successResponse(res, 'PIN reset successful', {
      message: 'You can now use your new PIN to access the app'
    });

  } catch (error) {
    console.error('Reset PIN Error:', error);
    return errorResponse(res, 'PIN reset failed', 500);
  }
};

//  GET DRIVER PROFILE 
exports.getDriverProfile = async (req, res) => {
  try {
    const driver = await Driver.findById(req.user._id)
      .select('-password -pin -resetPinToken -resetPinExpires -pinAttempts -pinLockedUntil');

    if (!driver) {
      return errorResponse(res, 'Driver profile not found', 404);
    }

    // Check if vehicle is assigned
    const vehicleAssigned = !!(driver.vehicleNumber && driver.vehicleType);

    return successResponse(res, 'Profile retrieved successfully', {
      driver: driver.toJSON(),
      vehicleAssigned,
      documentsUploaded: driver.documents.length,
      documentsVerified: driver.documents.filter(doc => doc.status === 'verified').length,
      documentsPending: driver.documents.filter(doc => doc.status === 'pending').length,
      canGoOnline: driver.profileStatus === 'approved' && vehicleAssigned
    });

  } catch (error) {
    console.error('Get Driver Profile Error:', error);
    return errorResponse(res, 'Failed to fetch profile', 500);
  }
};

//  TOGGLE AVAILABILITY 
exports.toggleAvailability = async (req, res) => {
  try {
    const driver = await Driver.findById(req.user._id);
    
    if (!driver) {
      return errorResponse(res, 'Driver not found', 404);
    }

    // Check if profile is approved
    if (driver.profileStatus !== 'approved') {
      return errorResponse(res, 'Your profile is not approved yet. Cannot go online.', 403);
    }

    // Check if vehicle is assigned
    if (!driver.vehicleNumber || !driver.vehicleType) {
      return errorResponse(res, 'Vehicle not assigned yet. Cannot go online.', 403);
    }

    // Toggle availability
    driver.isAvailable = !driver.isAvailable;
    await driver.save();

    const status = driver.isAvailable ? 'online' : 'offline';
    
    return successResponse(res, `You are now ${status}`, {
      isAvailable: driver.isAvailable,
      status
    });

  } catch (error) {
    console.error('Toggle Availability Error:', error);
    return errorResponse(res, 'Failed to update availability status', 500);
  }
};

exports.driverLogout = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 'No token provided', 401);
    }

    const token = authHeader.split(' ')[1];

    await Session.deleteOne({
      token,
      userId: req.user._id
    });

    const { refreshToken } = req.body;
    if (refreshToken) {
      await RefreshToken.deleteOne({
        token: refreshToken,
        userId: req.user._id
      });
    }

    return successResponse(res, 'Logged out successfully', {
      message: 'You have been logged out from this device'
    });

  } catch (error) {
    console.error('Driver Logout Error:', error);
    return errorResponse(res, 'Logout failed', 500);
  }
};

exports.driverLogoutAll = async (req, res) => {
  try {
    const driverId = req.user._id;

    await Session.deleteMany({ userId: driverId });

    await RefreshToken.deleteMany({ userId: driverId });

    return successResponse(res, 'Logged out from all devices successfully', {
      message: 'All sessions terminated'
    });

  } catch (error) {
    console.error('Logout All Error:', error);
    return errorResponse(res, 'Failed to logout from all devices', 500);
  }
};

module.exports = exports;