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


// exports.authenticateDriver = async (req, res, next) => {
//   try {
//     const authHeader = req.headers.authorization;

//     if (!authHeader || !authHeader.startsWith('Bearer ')) {
//       return unauthorizedResponse(res, 'No token provided');
//     }

//     const token = authHeader.split(' ')[1];

//     // Verify JWT
//     const decoded = verifyToken(token);
//     if (!decoded || !decoded.userId) {
//       return unauthorizedResponse(res, 'Invalid or expired token');
//     }

//     // Check active session
//     const session = await Session.findOne({
//       token,
//       userId: decoded.userId,
//       isActive: true,
//       expiresAt: { $gt: new Date() }
//     });

//     if (!session) {
//       return unauthorizedResponse(res, 'Session expired or invalid');
//     }

//     const driver = await Driver.findById(decoded.userId)
//       .select('-password -pin -resetPinToken -resetPinExpires');

//     if (!driver) {
//       return unauthorizedResponse(res, 'Driver not found');
//     }

//     if (!driver.isActive) {
//       return unauthorizedResponse(res, 'Your account is deactivated');
//     }

//     req.user = driver;
//     req.user._id = driver._id;
//     req.token = token;

//     next(); 

//   } catch (error) {
//     console.error('Driver Auth Error:', error);
//     return unauthorizedResponse(res, 'Authentication failed');
//   }
// };

exports.authenticateDriver = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const driver = await Driver.findById(decoded.id || decoded.userId);
    if (!driver) {
      return res.status(401).json({ success: false, message: 'Driver not found' });
    }

    if (driver.profileStatus !== 'approved') {
      return res.status(403).json({ success: false, message: 'Account not approved' });
    }

    req.user = driver;
    next();

  } catch (error) {
    console.error('Auth Error:', error);
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
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

exports.authenticateAny = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'Invalid token' });

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Token expired or invalid' });
    }

    if (!decoded.userId) {
      return res.status(401).json({ success: false, message: 'Invalid token payload' });
    }

    let driver = await Driver.findById(decoded.userId).select('-password -pin');
    if (driver && driver.isActive) {
      req.user = driver;
      req.user.role = 'driver';  
      req.token = token;
      return next();
    }

    let customer = await User.findById(decoded.userId).select('-password');
    if (customer && customer.isActive) {
      req.user = customer;
      req.user.role = customer.role || 'customer'; 
      req.token = token;
      return next();
    }

    return res.status(401).json({ success: false, message: 'User not found or inactive' });

  } catch (error) {
    console.error('authenticateAny Error:', error);
    return res.status(401).json({ success: false, message: 'Authentication failed' });
  }
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
//     let token;

//     if (req.headers.authorization?.startsWith('Bearer ')) {
//       token = req.headers.authorization.split(' ')[1];
//     }

//     if (!token) {
//       return res.status(401).json({
//         success: false,
//         message: 'Not authorized, no token'
//       });
//     }

//     // Verify token
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);

//     // Admin collection se dhundo!
//     const admin = await Admin.findById(decoded.userId || decoded.id);

//     if (!admin) {
//       return res.status(401).json({
//         success: false,
//         message: 'Admin not found or invalid token'
//       });
//     }

//     if (!admin.isActive) {
//       return res.status(403).json({
//         success: false,
//         message: 'Admin account is deactivated'
//       });
//     }

//     req.admin = admin;
//     req.admin.role = 'admin';

//     next();
//   } catch (error) {
//     console.error('protectAdmin Error:', error.message);
//     return res.status(401).json({
//       success: false,
//       message: 'Invalid or expired token'
//     });
//   }
// };

// exports.protectAdmin = async (req, res, next) => {
//   try {
//     let token;

//     if (req.headers.authorization?.startsWith('Bearer ')) {
//       token = req.headers.authorization.split(' ')[1];
//     }

//     if (!token) {
//       return res.status(401).json({
//         success: false,
//         message: 'Not authorized, no token'
//       });
//     }

//     const decoded = jwt.verify(token, process.env.JWT_SECRET);

//     const admin = await Admin.findById(decoded.userId || decoded.id);

//     if (!admin) {
//       return res.status(401).json({
//         success: false,
//         message: 'Admin not found or invalid token'
//       });
//     }

//     if (!admin.isActive) {
//       return res.status(403).json({
//         success: false,
//         message: 'Admin account is deactivated'
//       });
//     }

//     // req.user = admin;          
//     // req.user.role = 'admin';    

//     req.admin = admin;
//     req.admin.role = 'admin';

//     next();
//   } catch (error) {
//     console.error('protectAdmin Error:', error.message);
//     return res.status(401).json({
//       success: false,
//       message: 'Invalid or expired token'
//     });
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

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
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

    req.user = admin;
    req.user.role = 'admin';

    req.admin = admin;

    next();
  } catch (error) {
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

 

