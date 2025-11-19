const { verifyToken } = require('../utils/jwtHelper');
const User = require('../models/User');
const Session = require('../models/Session');
const { unauthorizedResponse } = require('../utils/responseHelper');
const Admin = require("../models/Admin")
const Driver = require('../models/Driver');
const jwt = require("jsonwebtoken")

// Verify JWT Token
exports.authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return unauthorizedResponse(res, 'No token provided');
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = verifyToken(token);

    if (!decoded) {
      return unauthorizedResponse(res, 'Invalid or expired token');
    }

    // Check if session exists and is active
    const session = await Session.findOne({
      token,
      userId: decoded.userId,
      isActive: true,
      expiresAt: { $gt: new Date() }
    });

    if (!session) {
      return unauthorizedResponse(res, 'Session expired or invalid');
    }

    // Get user
    const user = await User.findById(decoded.userId).select('-password');

    if (!user || !user.isActive) {
      return unauthorizedResponse(res, 'User not found or inactive');
    }

    // Attach user to request
    req.user = user;
    req.token = token;

    next();
  } catch (error) {
    return unauthorizedResponse(res, 'Authentication failed');
  }
};


exports.authenticateDriver = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return unauthorizedResponse(res, 'No token provided');
    }

    const token = authHeader.split(' ')[1];

    // Verify JWT
    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
      return unauthorizedResponse(res, 'Invalid or expired token');
    }

    // Check active session
    const session = await Session.findOne({
      token,
      userId: decoded.userId,
      isActive: true,
      expiresAt: { $gt: new Date() }
    });

    if (!session) {
      return unauthorizedResponse(res, 'Session expired or invalid');
    }

    // SIRF DRIVER DHUNDO — User model bilkul nahi!
    const driver = await Driver.findById(decoded.userId)
      .select('-password -pin -resetPinToken -resetPinExpires');

    if (!driver) {
      return unauthorizedResponse(res, 'Driver not found');
    }

    if (!driver.isActive) {
      return unauthorizedResponse(res, 'Your account is deactivated');
    }

    // req.user mein DRIVER daal do
    req.user = driver;
    req.user._id = driver._id;
    req.token = token;

    next();

  } catch (error) {
    console.error('Driver Auth Error:', error);
    return unauthorizedResponse(res, 'Authentication failed');
  }
};

// Check if user is driver
exports.isDriver = async (req, res, next) => {
  if (req.user.role !== 'driver') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Driver role required.'
    });
  }
  next();
};

// Check if user is customer
exports.isCustomer = async (req, res, next) => {
  if (req.user.role !== 'customer') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Customer role required.'
    });
  }
  next();
};

// // Check if user is admin
// exports.isAdmin = async (req, res, next) => {
//   if (req.user.role !== 'admin') {
//     return res.status(403).json({
//       success: false,
//       message: 'Access denied. Admin role required.'
//     });
//   }
//   next();
// };

// exports.protectAdmin = async (req, res, next) => {
//   try {
//     let adminId = null;
//     let token = null;

//     // Session check (web)
//     if (req.session?.admin?.id) {
//       adminId = req.session.admin.id;
//     }
//     // JWT check (API)
//     else if (req.headers.authorization?.startsWith('Bearer ')) {
//       token = req.headers.authorization.split(' ')[1];
//       const decoded = verifyToken(token);
//       if (!decoded?.userId) return unauthorizedResponse(res, 'Invalid token');
//       adminId = decoded.userId;
//     } else {
//       return unauthorizedResponse(res, 'Admin login required');
//     }

//     const admin = await Admin.findById(adminId).select('-password');
//     if (!admin || !admin.isActive) {
//       return unauthorizedResponse(res, 'Admin not found or deactivated');
//     }

//     req.admin = admin;
//     next();

//   } catch (error) {
//     return unauthorizedResponse(res, 'Authentication failed');
//   }
// };

exports.protectAdmin = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, no token'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Admin collection se dhundo!
    const admin = await Admin.findById(decoded.userId || decoded.id);

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Admin not found or invalid token'
      });
    }

    if (!admin.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Admin account is deactivated'
      });
    }

    // YEHI ZAROORI — req.admin set karo (req.user nahi!)
    req.admin = admin;
    req.admin.role = 'admin'; // optional, agar kahi use ho

    next();
  } catch (error) {
    console.error('protectAdmin Error:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

exports.isAdmin = (req, res, next) => {
  if (req.admin && req.admin.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
};

// Check if user is customer
exports.isCustomer = async (req, res, next) => {
  if (req.user.role !== 'customer') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Customer role required.'
    });
  }
  next();
};
