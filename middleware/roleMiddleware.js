const Permission = require('../models/Permission');
const Role = require('../models/Role');
const Admin = require('../models/Admin');
const { forbiddenResponse } = require('../utils/responseHelper');

// Check specific permission
// exports.checkPermission = (resource, action) => {
//   return async (req, res, next) => {
//     try {
//       if (req.user.role !== 'admin') {
//         return forbiddenResponse(res, 'Admin access required');
//       }

//       // Get admin details with permissions
//       const admin = await Admin.findOne({ userId: req.user._id })
//         .populate('permissions');

//       if (!admin) {
//         return forbiddenResponse(res, 'Admin profile not found');
//       }

//       // Check if admin has required permission
//       const hasPermission = admin.permissions.some(
//         permission => permission.resource === resource && permission.action === action
//       );

//       if (!hasPermission) {
//         return forbiddenResponse(res, `Permission denied: ${action} on ${resource}`);
//       }

//       next();
//     } catch (error) {
//       return res.status(500).json({
//         success: false,
//         message: 'Error checking permissions',
//         error: error.message
//       });
//     }
//   };
// };
// middleware/roleMiddleware.js → PURA REPLACE KAR DO

exports.checkPermission = (resource, action) => {
  return (req, res, next) => {
    // Admin ho sakta hai req.admin ya req.user mein
    const user = req.admin || req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated - No user found'
      });
    }

    // Agar admin hai (chahe Admin model ho ya User model) → sab permission
    if (user.role === 'admin' || user.isSuperAdmin || user.role === 'admin') {
      return next();
    }

    // Future mein granular permissions add kar sakte ho
    // Abhi ke liye admin ko hi sab allow
    return res.status(403).json({
      success: false,
      message: 'Permission denied - Admin access required'
    });
  };
};

// Check multiple permissions (any of them)
exports.checkAnyPermission = (permissionsArray) => {
  return async (req, res, next) => {
    try {
      if (req.user.role !== 'admin') {
        return forbiddenResponse(res, 'Admin access required');
      }

      const admin = await Admin.findOne({ userId: req.user._id })
        .populate('permissions');

      if (!admin) {
        return forbiddenResponse(res, 'Admin profile not found');
      }

      // Check if admin has any of the required permissions
      const hasAnyPermission = permissionsArray.some(({ resource, action }) =>
        admin.permissions.some(
          permission => permission.resource === resource && permission.action === action
        )
      );

      if (!hasAnyPermission) {
        return forbiddenResponse(res, 'Insufficient permissions');
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error checking permissions',
        error: error.message
      });
    }
  };
};