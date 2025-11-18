// const User = require('../models/User');
// const Driver = require('../models/Driver');
// const Session = require('../models/Session');
// const RefreshToken = require('../models/RefreshToken');
// const jwtHelper = require('../utils/jwtHelper');
// const { hashPin, validatePin, isValidPinFormat, generateResetToken } = require('../utils/pinHelper');
// const { sendWelcomeEmail } = require('../utils/emailHelper');
// const { sendPinResetSMS } = require('../utils/smsHelper');
// const { successResponse, errorResponse } = require('../utils/responseHelper');

// // Driver Signup
// exports.driverSignup = async (req, res) => {
//   try {
//     const {
//       name,
//       email,
//       phone,
//       password,
//       licenseNumber,
//       vehicleType,
//       vehicleNumber,
//       vehicleModel,
//       vehicleColor,
//       pin
//     } = req.body;

//     // Validate PIN format
//     if (!isValidPinFormat(pin)) {
//       return errorResponse(res, 'PIN must be exactly 4 digits', 400);
//     }

//     // Check if user already exists
//     const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
//     if (existingUser) {
//       return errorResponse(res, 'User with this email or phone already exists', 400);
//     }

//     // Check if license or vehicle number already exists
//     const existingDriver = await Driver.findOne({
//       $or: [{ licenseNumber }, { vehicleNumber }]
//     });
//     if (existingDriver) {
//       return errorResponse(res, 'License number or vehicle number already registered', 400);
//     }

//     // Create user
//     const user = await User.create({
//       name,
//       email,
//       phone,
//       password,
//       role: 'driver'
//     });

//     // Hash PIN
//     const hashedPin = await hashPin(pin);

//     // Create driver profile
//     const driver = await Driver.create({
//       userId: user._id,
//       licenseNumber,
//       vehicleType,
//       vehicleNumber,
//       vehicleModel,
//       vehicleColor,
//       pin: hashedPin,
//       profileStatus: 'incomplete'
//     });

//     // Generate tokens - FIX HERE
//     const accessToken = jwtHelper.generateAccessToken(user._id, user.role);
//     const refreshToken = jwtHelper.generateRefreshToken(user._id);

//     // Save refresh token
//     const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
//     await RefreshToken.create({
//       userId: user._id,
//       token: refreshToken,
//       expiresAt
//     });

//     // Create session
//     await Session.create({
//       userId: user._id,
//       token: accessToken,
//       deviceInfo: req.headers['user-agent'],
//       ipAddress: req.ip,
//       expiresAt: new Date(Date.now() + 15 * 60 * 1000)
//     });

//     // Send welcome email
//     await sendWelcomeEmail(user.email, user.name);

//     successResponse(res, 'Driver registered successfully', {
//       user: {
//         id: user._id,
//         name: user.name,
//         email: user.email,
//         phone: user.phone,
//         role: user.role
//       },
//       driver: {
//         id: driver._id,
//         licenseNumber: driver.licenseNumber,
//         vehicleType: driver.vehicleType,
//         vehicleNumber: driver.vehicleNumber,
//         profileStatus: driver.profileStatus
//       },
//       accessToken,
//       refreshToken
//     }, 201);
//   } catch (error) {
//     console.error('Driver Signup Error:', error);
//     errorResponse(res, error.message);
//   }
// };

// // Driver Signin
// exports.driverSignin = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     // Find user
//     const user = await User.findOne({ email, role: 'driver' });
//     if (!user) {
//       return errorResponse(res, 'Invalid credentials', 401);
//     }

//     // Check if user is active
//     if (!user.isActive) {
//       return errorResponse(res, 'Account is deactivated', 403);
//     }

//     // Verify password
//     const isPasswordValid = await user.comparePassword(password);
//     if (!isPasswordValid) {
//       return errorResponse(res, 'Invalid credentials', 401);
//     }

//     // Get driver profile
//     const driver = await Driver.findOne({ userId: user._id });

//     // Generate tokens - FIX HERE
//     const accessToken = jwtHelper.generateAccessToken(user._id, user.role);
//     const refreshToken = jwtHelper.generateRefreshToken(user._id);

//     // Save refresh token
//     const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
//     await RefreshToken.create({
//       userId: user._id,
//       token: refreshToken,
//       expiresAt
//     });

//     // Create session
//     await Session.create({
//       userId: user._id,
//       token: accessToken,
//       deviceInfo: req.headers['user-agent'],
//       ipAddress: req.ip,
//       expiresAt: new Date(Date.now() + 15 * 60 * 1000)
//     });

//     successResponse(res, 'Login successful', {
//       user: {
//         id: user._id,
//         name: user.name,
//         email: user.email,
//         phone: user.phone,
//         role: user.role
//       },
//       driver: {
//         id: driver._id,
//         profileStatus: driver.profileStatus,
//         isAvailable: driver.isAvailable
//       },
//       accessToken,
//       refreshToken
//     });
//   } catch (error) {
//     console.error('Driver Signin Error:', error);
//     errorResponse(res, error.message);
//   }
// };

// // Validate PIN
// exports.validatePin = async (req, res) => {
//   try {
//     const { pin } = req.body;

//     // Get driver
//     const driver = await Driver.findOne({ userId: req.user._id });
//     if (!driver) {
//       return errorResponse(res, 'Driver profile not found', 404);
//     }

//     // Check if PIN is locked
//     if (driver.pinLockedUntil && driver.pinLockedUntil > new Date()) {
//       const minutesLeft = Math.ceil((driver.pinLockedUntil - new Date()) / 60000);
//       return errorResponse(res, `PIN is locked. Try again in ${minutesLeft} minutes`, 423);
//     }

//     // Validate PIN
//     const isValid = await validatePin(pin, driver.pin);

//     if (!isValid) {
//       driver.pinAttempts += 1;

//       // Lock PIN after 3 failed attempts
//       if (driver.pinAttempts >= 3) {
//         driver.pinLockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
//         driver.pinAttempts = 0;
//         await driver.save();
//         return errorResponse(res, 'Too many failed attempts. PIN locked for 15 minutes', 423);
//       }

//       await driver.save();
//       return errorResponse(res, `Invalid PIN. ${3 - driver.pinAttempts} attempts remaining`, 401);
//     }

//     // Reset attempts on success
//     driver.pinAttempts = 0;
//     driver.pinLockedUntil = null;
//     await driver.save();

//     successResponse(res, 'PIN validated successfully');
//   } catch (error) {
//     console.error('Validate PIN Error:', error);
//     errorResponse(res, error.message);
//   }
// };

// // Change PIN
// exports.changePin = async (req, res) => {
//   try {
//     const { currentPin, newPin } = req.body;

//     // Get driver
//     const driver = await Driver.findOne({ userId: req.user._id });
//     if (!driver) {
//       return errorResponse(res, 'Driver profile not found', 404);
//     }

//     // Verify current PIN
//     const isValid = await validatePin(currentPin, driver.pin);
//     if (!isValid) {
//       return errorResponse(res, 'Current PIN is incorrect', 401);
//     }

//     // Hash and update new PIN
//     driver.pin = await hashPin(newPin);
//     driver.pinAttempts = 0;
//     driver.pinLockedUntil = null;
//     await driver.save();

//     successResponse(res, 'PIN changed successfully');
//   } catch (error) {
//     console.error('Change PIN Error:', error);
//     errorResponse(res, error.message);
//   }
// };

// // Forgot PIN
// exports.forgotPin = async (req, res) => {
//   try {
//     const { phone } = req.body;

//     // Find user by phone
//     const user = await User.findOne({ phone, role: 'driver' });
//     if (!user) {
//       // Don't reveal if user exists
//       return successResponse(res, 'If phone number exists, reset code has been sent');
//     }

//     // Get driver
//     const driver = await Driver.findOne({ userId: user._id });

//     // Generate reset token
//     const resetToken = generateResetToken();

//     // Save reset token
//     driver.resetPinToken = resetToken;
//     driver.resetPinExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
//     await driver.save();

//     // Send SMS with reset code
//     await sendPinResetSMS(user.phone, resetToken);

//     successResponse(res, 'PIN reset code has been sent to your phone');
//   } catch (error) {
//     console.error('Forgot PIN Error:', error);
//     errorResponse(res, error.message);
//   }
// };

// // Reset PIN
// exports.resetPin = async (req, res) => {
//   try {
//     const { phone, resetToken, newPin } = req.body;

//     // Validate new PIN format
//     if (!isValidPinFormat(newPin)) {
//       return errorResponse(res, 'PIN must be exactly 4 digits', 400);
//     }

//     // Find user
//     const user = await User.findOne({ phone, role: 'driver' });
//     if (!user) {
//       return errorResponse(res, 'Invalid reset code', 400);
//     }

//     // Find driver with valid reset token
//     const driver = await Driver.findOne({
//       userId: user._id,
//       resetPinToken: resetToken,
//       resetPinExpires: { $gt: new Date() }
//     });

//     if (!driver) {
//       return errorResponse(res, 'Invalid or expired reset code', 400);
//     }

//     // Hash and update PIN
//     driver.pin = await hashPin(newPin);
//     driver.pinAttempts = 0;
//     driver.pinLockedUntil = null;
//     driver.resetPinToken = undefined;
//     driver.resetPinExpires = undefined;
//     await driver.save();

//     successResponse(res, 'PIN reset successful');
//   } catch (error) {
//     console.error('Reset PIN Error:', error);
//     errorResponse(res, error.message);
//   }
// };

// // Get Driver Profile
// exports.getDriverProfile = async (req, res) => {
//   try {
//     const driver = await Driver.findOne({ userId: req.user._id })
//       .populate('userId', 'name email phone profileImage');

//     if (!driver) {
//       return errorResponse(res, 'Driver profile not found', 404);
//     }

//     successResponse(res, 'Driver profile retrieved successfully', driver);
//   } catch (error) {
//     console.error('Get Driver Profile Error:', error);
//     errorResponse(res, error.message);
//   }
// };

// // Toggle Driver Availability
// exports.toggleAvailability = async (req, res) => {
//   try {
//     const driver = await Driver.findOne({ userId: req.user._id });

//     if (!driver) {
//       return errorResponse(res, 'Driver profile not found', 404);
//     }

//     // Check if profile is approved
//     if (driver.profileStatus !== 'approved') {
//       return errorResponse(res, 'Profile must be approved before going online', 403);
//     }

//     // Toggle availability
//     driver.isAvailable = !driver.isAvailable;
//     await driver.save();

//     successResponse(res, 'Availability updated successfully', {
//       isAvailable: driver.isAvailable
//     });
//   } catch (error) {
//     console.error('Toggle Availability Error:', error);
//     errorResponse(res, error.message);
//   }
// };


const User = require('../models/User');
const Driver = require('../models/Driver');
const Session = require('../models/Session');
const RefreshToken = require('../models/RefreshToken');
const jwtHelper = require('../utils/jwtHelper');
const { hashPin, validatePin, isValidPinFormat, generateResetToken } = require('../utils/pinHelper');
const { sendWelcomeEmail } = require('../utils/emailHelper');
const { sendPinResetSMS } = require('../utils/smsHelper');
const { successResponse, errorResponse } = require('../utils/responseHelper');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');


exports.driverSignup = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      name, email, phone, password,
      licenseNumber, vehicleType, vehicleNumber,
      vehicleModel, vehicleColor, pin
    } = req.body;

    // Validate PIN
    if (!pin || !/^\d{4}$/.test(pin)) {
      return errorResponse(res, 'PIN must be exactly 4 digits', 400);
    }

    // Validate password length
    if (!password || password.length < 6) {
      return errorResponse(res, 'Password must be at least 6 characters', 400);
    }

    // Check if driver already exists (email, phone, license, vehicle)
    const exists = await Driver.findOne({
      $or: [
        { email },
        { phone },
        { licenseNumber },
        { vehicleNumber: vehicleNumber?.toUpperCase() }
      ]
    });

    if (exists) {
      return errorResponse(res, 'Email, phone, license or vehicle already registered', 400);
    }

    // Hash password aur PIN
    const hashedPassword = await bcrypt.hash(password, 10);
    const hashedPin = await bcrypt.hash(pin, 10);

    // SIRF DRIVER CREATE KARO — User mat banao!
    const driver = await Driver.create([{
      name,
      email: email.toLowerCase(),
      phone,
      password: hashedPassword,
      role: 'driver',

      licenseNumber,
      vehicleType,
      vehicleNumber: vehicleNumber.toUpperCase(),
      vehicleModel: vehicleModel || '',
      vehicleColor: vehicleColor || '',
      pin: hashedPin,

      profileStatus: 'pending_verification',
      isActive: true
    }], { session });

    // Generate tokens (driver._id use karo)
    const accessToken = jwtHelper.generateAccessToken(driver[0]._id, 'driver');
    const refreshToken = jwtHelper.generateRefreshToken(driver[0]._id);
    const expiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await RefreshToken.create([{
      userId: driver[0]._id,
      token: refreshToken,
      expiresAt: expiry
    }], { session });

    await Session.create([{
      userId: driver[0]._id,
      token: accessToken,
      deviceInfo: req.headers['user-agent'] || 'Unknown',
      ipAddress: req.ip,
      expiresAt: expiry
    }], { session });

    await session.commitTransaction();

    // Email bhejo
    sendWelcomeEmail(email, name).catch(console.error);

    return successResponse(res, 'Driver registered successfully!', {
      driver: {
        id: driver[0]._id,
        name: driver[0].name,
        email: driver[0].email,
        phone: driver[0].phone,
        profileStatus: driver[0].profileStatus
      },
      accessToken,
      refreshToken
    }, 201);

  } catch (error) {
    await session.abortTransaction();
    console.error('Driver Signup Error:', error);

    if (error.code === 11000) {
      return errorResponse(res, 'Email, phone, license or vehicle already exists', 400);
    }
    if (error.name === 'ValidationError') {
      const msg = Object.values(error.errors)[0]?.message || 'Invalid data';
      return errorResponse(res, msg, 400);
    }

    return errorResponse(res, 'Registration failed', 500);
  } finally {
    session.endSession();
  }
};

exports.driverSignin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      return errorResponse(res, 'Email and password are required', 400);
    }

    // Sirf Driver collection mein dhundo (User ko chhodo bilkul)
    const driver = await Driver.findOne({
      email: email.toLowerCase()
    }).select('+password'); // +password because we excluded it in toJSON

    // Agar driver nahi mila
    if (!driver) {
      return errorResponse(res, 'Invalid email or password', 401);
    }

    // Account deactivated?
    if (!driver.isActive) {
      return errorResponse(res, 'Your account has been deactivated. Contact support.', 403);
    }

    // Password check
    const isPasswordValid = await driver.comparePassword(password);
    if (!isPasswordValid) {
      return errorResponse(res, 'Invalid email or password', 401);
    }

    // Generate tokens (driver._id use karo, User ka nahi)
    const accessToken = jwtHelper.generateAccessToken(driver._id, 'driver');
    const refreshToken = jwtHelper.generateRefreshToken(driver._id);

    const expiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Save tokens in Session & RefreshToken (userId = driver._id)
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
    return successResponse(res, 'Driver login successful', {
      driver: {
        id: driver._id,
        name: driver.name,
        email: driver.email,
        phone: driver.phone,
        role: driver.role,
        profileStatus: driver.profileStatus,
        isAvailable: driver.isAvailable,
        isActive: driver.isActive,
        vehicleType: driver.vehicleType,
        vehicleNumber: driver.vehicleNumber,
        profileImage: driver.profileImage || null
      },
      accessToken,
      refreshToken
    });

  } catch (error) {
    console.error('Driver Signin Error:', error);
    return errorResponse(res, 'Login failed. Please try again.', 500);
  }
};

//  Validate PIN - FIXED
exports.validatePin = async (req, res) => {
  try {
    const { pin } = req.body;

    if (!pin || !/^\d{4}$/.test(pin)) {
      return errorResponse(res, 'PIN must be 4 digits', 400);
    }

    // YEHI SAHI HAI — direct driver._id se dhundo
    const driver = await Driver.findById(req.user._id);

    if (!driver) {
      return errorResponse(res, 'Driver not found', 404);
    }

    if (!driver.isActive) {
      return errorResponse(res, 'Account deactivated', 403);
    }

    // Lock check
    if (driver.pinLockedUntil && driver.pinLockedUntil > new Date()) {
      const mins = Math.ceil((driver.pinLockedUntil - new Date()) / 60000);
      return errorResponse(res, `PIN locked. Try again in ${mins} minute(s)`, 423);
    }

    const isValid = await bcrypt.compare(pin, driver.pin);

    if (!isValid) {
      driver.pinAttempts = (driver.pinAttempts || 0) + 1;
      if (driver.pinAttempts >= 3) {
        driver.pinLockedUntil = new Date(Date.now() + 15 * 60 * 1000);
        driver.pinAttempts = 0;
      }
      await driver.save();
      return errorResponse(res, `Wrong PIN. ${3 - driver.pinAttempts} attempts left`, 401);
    }

    driver.pinAttempts = 0;
    driver.pinLockedUntil = null;
    await driver.save();

    return successResponse(res, 'PIN validated successfully');

  } catch (error) {
    console.error('Validate PIN Error:', error);
    return errorResponse(res, 'Validation failed', 500);
  }
};

//  Change PIN - FIXED
exports.changePin = async (req, res) => {
  try {
    const { currentPin, newPin } = req.body;

    if (!currentPin || !newPin || currentPin === newPin) {
      return errorResponse(res, 'Current & new PIN required and must be different', 400);
    }

    if (!/^\d{4}$/.test(newPin)) {
      return errorResponse(res, 'New PIN must be 4 digits', 400);
    }

    const driver = await Driver.findById(req.user._id);
    if (!driver) return errorResponse(res, 'Driver not found', 404);

    if (driver.pinLockedUntil && driver.pinLockedUntil > new Date()) {
      const mins = Math.ceil((driver.pinLockedUntil - new Date()) / 60000);
      return errorResponse(res, `PIN locked. Try again in ${mins} minute(s)`, 423);
    }

    const isValid = await bcrypt.compare(currentPin, driver.pin);
    if (!isValid) {
      driver.pinAttempts = (driver.pinAttempts || 0) + 1;
      if (driver.pinAttempts >= 3) {
        driver.pinLockedUntil = new Date(Date.now() + 15 * 60 * 1000);
        driver.pinAttempts = 0;
      }
      await driver.save();
      return errorResponse(res, `Wrong current PIN. ${3 - driver.pinAttempts} attempts left`, 401);
    }

    driver.pin = await bcrypt.hash(newPin, 10);
    driver.pinAttempts = 0;
    driver.pinLockedUntil = null;
    await driver.save();

    return successResponse(res, 'PIN changed successfully');

  } catch (error) {
    console.error(error);
    return errorResponse(res, 'Failed to change PIN', 500);
  }
};

// Forgot PIN - FIXED (Sirf Driver se dhundo)
exports.forgotPin = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone || !/^\d{10}$/.test(phone)) {
      return errorResponse(res, 'Valid 10-digit phone required', 400);
    }

    const driver = await Driver.findOne({ phone });
    if (!driver) {
      return successResponse(res, 'If phone exists, you will receive a reset code');
    }

    const resetToken = Math.floor(100000 + Math.random() * 900000).toString();

    driver.resetPinToken = resetToken;
    driver.resetPinExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await driver.save();

    sendPinResetSMS(phone, resetToken).catch(console.error);

    return successResponse(res, 'If phone exists, reset code sent');

  } catch (error) {
    console.error(error);
    return errorResponse(res, 'Request failed', 500);
  }
};

//  Reset PIN - FIXED
exports.resetPin = async (req, res) => {
  try {
    const { phone, resetToken, newPin } = req.body;

    if (!phone || !resetToken || !newPin) {
      return errorResponse(res, 'All fields required', 400);
    }

    if (!/^\d{10}$/.test(phone) || !/^\d{4}$/.test(newPin)) {
      return errorResponse(res, 'Invalid phone or PIN format', 400);
    }

    const driver = await Driver.findOne({
      phone,
      resetPinToken: resetToken,
      resetPinExpires: { $gt: new Date() }
    });

    if (!driver) {
      return errorResponse(res, 'Invalid or expired code', 400);
    }

    driver.pin = await bcrypt.hash(newPin, 10);
    driver.resetPinToken = undefined;
    driver.resetPinExpires = undefined;
    driver.pinAttempts = 0;
    driver.pinLockedUntil = null;
    await driver.save();

    return successResponse(res, 'PIN reset successful');

  } catch (error) {
    console.error(error);
    return errorResponse(res, 'Reset failed', 500);
  }
};

//  Get Profile 
// controllers/profileController.js
exports.getDriverProfile = async (req, res) => {
  try {
    const driver = await Driver.findById(req.user._id)
      .select('-password -pin -resetPinToken -resetPinExpires'); // sensitive fields hata do

    if (!driver) return errorResponse(res, 'Profile not found', 404);

    return successResponse(res, 'Profile fetched successfully', {
      driver: driver.toJSON(), // documents bhi include honge
      totalDocuments: driver.documents.length,
      profileStatus: driver.profileStatus
    });

  } catch (error) {
    console.error(error);
    return errorResponse(res, 'Failed to fetch profile', 500);
  }
};

// 6. Toggle Availability 
exports.toggleAvailability = async (req, res) => {
  try {
    const driver = await Driver.findById(req.user._id);
    if (!driver) return errorResponse(res, 'Driver not found', 404);

    if (driver.profileStatus !== 'approved') {
      return errorResponse(res, 'Profile not approved yet', 403);
    }

    driver.isAvailable = !driver.isAvailable;
    await driver.save();

    return successResponse(res, `You are now ${driver.isAvailable ? 'online' : 'offline'}`, {
      isAvailable: driver.isAvailable
    });

  } catch (error) {
    console.error(error);
    return errorResponse(res, 'Failed to update status', 500);
  }
};