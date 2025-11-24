const Permission = require('../models/Permission');
const Role = require('../models/Role');
const Admin = require('../models/Admin');
const { forbiddenResponse, errorResponse } = require('../utils/responseHelper');


// Permission structure
const permissions = {
  admin: {
    vehicles: ['create', 'read', 'update', 'delete'],
    customers: ['create', 'read', 'update', 'delete'],
    regions: ['create', 'read', 'update', 'delete'],
    // drivers: ['create', 'read', 'update', 'delete'],
    // permissions object
    drivers: ['create', 'read', 'update', 'delete', 'approve', 'reject', 'block', 'unblock'],
    orders: ['create', 'read', 'update', 'delete'],
    deliveries: ['create', 'read', 'update', 'delete']
  },
  manager: {
    vehicles: ['read', 'update'],
    customers: ['create', 'read', 'update'],
    regions: ['read'],
    drivers: ['read', 'update'],
    orders: ['create', 'read', 'update'],
    deliveries: ['create', 'read', 'update']
  },
  driver: {
    deliveries: ['read', 'update'],
    orders: ['read']
  }
};


exports.checkPermission = (resource, action) => {
  return (req, res, next) => {

    const user = req.admin || req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated - No user found'
      });
    }

    if (user.role === 'admin' || user.isSuperAdmin || user.role === 'admin') {
      return next();
    }

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



// exports.checkPermission = (resource, action) => {
//   return (req, res, next) => {
//     const user = req.user;

//     if (!user || !user.role) {
//       return errorResponse(res, 'Not authenticated', 401);
//     }

//     const role = user.role;

//     if (!permissions[role]) {
//       return errorResponse(res, 'Invalid role', 403);
//     }

//     const allowedActions = permissions[role][resource];

//     if (!allowedActions || !allowedActions.includes(action)) {
//       return errorResponse(res, `Permission denied: Cannot ${action} ${resource}`, 403);
//     }

//     next();
//   };
// };
// // Check if user is admin or manager
// exports.isAdminOrManager = (req, res, next) => {
//   if (req.user.role !== 'admin' && req.user.role !== 'manager') {
//     return errorResponse(res, 'Access denied. Admin or Manager role required.', 403);
//   }
//   next();
// };
