// const User = require('../../models/User');
// const Admin = require('../../models/Admin');
// const Session = require('../../models/Session');
// const RefreshToken = require('../../models/RefreshToken');
// const { generateAccessToken, generateRefreshToken } = require('../../utils/jwtHelper');
// const { sendWelcomeEmail } = require('../../utils/emailHelper');
// const { successResponse, errorResponse } = require('../../utils/responseHelper');

// // Admin Signup (Only for creating first admin or by super admin)
// exports.adminSignup = async (req, res) => {
//   try {
//     const { name, email, phone, password, department, employeeId } = req.body;

//     // Check if user already exists
//     const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
//     if (existingUser) {
//       return errorResponse(res, 'User with this email or phone already exists', 400);
//     }

//     // Create user
//     const user = await User.create({
//       name,
//       email,
//       phone,
//       password,
//       role: 'admin',
//       isVerified: true // Admins are auto-verified
//     });

//     // Create admin profile
//     const admin = await Admin.create({
//       userId: user._id,
//       department,
//       employeeId,
//       permissions: [] // Permissions to be assigned later
//     });

//     // Send welcome email
//     await sendWelcomeEmail(user.email, user.name);

//     successResponse(res, 'Admin created successfully', {
//       user: {
//         id: user._id,
//         name: user.name,
//         email: user.email,
//         role: user.role
//       },
//       admin: {
//         id: admin._id,
//         department: admin.department,
//         employeeId: admin.employeeId
//       }
//     }, 201);
//   } catch (error) {
//     errorResponse(res, error.message);
//   }
// };

// // Admin Signin
// exports.adminSignin = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     // Find admin user
//     const user = await User.findOne({ email, role: 'admin' });
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

//     // Get admin profile with permissions
//     const admin = await Admin.findOne({ userId: user._id })
//       .populate('permissions');

//     // Generate tokens
//     const accessToken = generateAccessToken(user._id, user.role);
//     const refreshToken = generateRefreshToken(user._id);

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

//     successResponse(res, 'Admin login successful', {
//       user: {
//         id: user._id,
//         name: user.name,
//         email: user.email,
//         role: user.role
//       },
//       admin: {
//         id: admin._id,
//         department: admin.department,
//         permissions: admin.permissions
//       },
//       accessToken,
//       refreshToken
//     });
//   } catch (error) {
//     errorResponse(res, error.message);
//   }
// };

// // Get Admin Profile
// exports.getAdminProfile = async (req, res) => {
//   try {
//     const admin = await Admin.findOne({ userId: req.user._id })
//       .populate('userId', 'name email phone profileImage')
//       .populate('permissions');

//     if (!admin) {
//       return errorResponse(res, 'Admin profile not found', 404);
//     }

//     successResponse(res, 'Admin profile retrieved successfully', { admin });
//   } catch (error) {
//     errorResponse(res, error.message);
//   }
// };

// // Update Admin Profile
// exports.updateAdminProfile = async (req, res) => {
//   try {
//     const { department } = req.body;

//     const admin = await Admin.findOne({ userId: req.user._id });
//     if (!admin) {
//       return errorResponse(res, 'Admin profile not found', 404);
//     }

//     if (department) admin.department = department;
//     await admin.save();

//     successResponse(res, 'Admin profile updated successfully', { admin });
//   } catch (error) {
//     errorResponse(res, error.message);
//   }
// };

///////////////////////////////////////////////////////////////////2nd

// const User = require('../../models/User');
// const Admin = require('../../models/Admin');
// const Session = require('../../models/Session');
// const RefreshToken = require('../../models/RefreshToken');
// const jwtHelper = require('../../utils/jwtHelper');
// const { sendWelcomeEmail } = require('../../utils/emailHelper');
// const { successResponse, errorResponse } = require('../../utils/responseHelper');

// // Admin Signup (Only for creating first admin or by super admin)
// exports.adminSignup = async (req, res) => {
//   try {
//     const { name, email, phone, password,  } = req.body;

//     // Check if user already exists
//     const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
//     if (existingUser) {
//       return errorResponse(res, 'User with this email or phone already exists', 400);
//     }

//     // Create user
//     const user = await User.create({
//       name,
//       email,
//       phone,
//       password,
//       role: 'admin',
//       isVerified: true // Admins are auto-verified
//     });

//     // Create admin profile
//     const admin = await Admin.create({
//       userId: user._id,
//       department,
//       employeeId,
//       permissions: [] // Permissions to be assigned later
//     });

//     // Send welcome email
//     await sendWelcomeEmail(user.email, user.name);

//     successResponse(res, 'Admin created successfully', {
//       user: {
//         id: user._id,
//         name: user.name,
//         email: user.email,
//         role: user.role
//       },
//       admin: {
//         id: admin._id,
//         department: admin.department,
//         employeeId: admin.employeeId
//       }
//     }, 201);
//   } catch (error) {
//     console.error('Admin Signup Error:', error);
//     errorResponse(res, error.message);
//   }
// };

// // Admin Signin
// exports.adminSignin = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     // Find admin user
//     const user = await User.findOne({ email, role: 'admin' });
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

//     // Get admin profile with permissions
//     const admin = await Admin.findOne({ userId: user._id })
//       .populate('permissions');

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

//     successResponse(res, 'Admin login successful', {
//       user: {
//         id: user._id,
//         name: user.name,
//         email: user.email,
//         role: user.role
//       },
//       admin: {
//         id: admin._id,
//         department: admin.department,
//         permissions: admin.permissions
//       },
//       accessToken,
//       refreshToken
//     });
//   } catch (error) {
//     console.error('Admin Signin Error:', error);
//     errorResponse(res, error.message);
//   }
// };

// // Get Admin Profile
// exports.getAdminProfile = async (req, res) => {
//   try {
//     const admin = await Admin.findOne({ userId: req.user._id })
//       .populate('userId', 'name email phone profileImage')
//       .populate('permissions');

//     if (!admin) {
//       return errorResponse(res, 'Admin profile not found', 404);
//     }

//     successResponse(res, 'Admin profile retrieved successfully', { admin });
//   } catch (error) {
//     console.error('Get Admin Profile Error:', error);
//     errorResponse(res, error.message);
//   }
// };

// // Update Admin Profile
// exports.updateAdminProfile = async (req, res) => {
//   try {
//     const { department } = req.body;

//     const admin = await Admin.findOne({ userId: req.user._id });
//     if (!admin) {
//       return errorResponse(res, 'Admin profile not found', 404);
//     }

//     if (department) admin.department = department;
//     await admin.save();

//     successResponse(res, 'Admin profile updated successfully', { admin });
//   } catch (error) {
//     console.error('Update Admin Profile Error:', error);
//     errorResponse(res, error.message);
//   }
// };


// controllers/adminController.js 

const Admin = require('../../models/Admin');
const Session = require('../../models/Session');
const RefreshToken = require('../../models/RefreshToken');
const jwtHelper = require('../../utils/jwtHelper');
const { sendWelcomeEmail } = require('../../utils/emailHelper');
const { successResponse, errorResponse } = require('../../utils/responseHelper');

// Admin Signup (Only for creating first admin or superadmin)
exports.adminSignup = async (req, res) => {
  try {
    const { name, email, phone, password, department, employeeId, permissions = [] } = req.body;

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ 
      $or: [{ email }, { phone }] 
    });
    if (existingAdmin) {
      return errorResponse(res, 'Admin with this email or phone already exists', 400);
    }

    // Create admin directly (no User model)
    const admin = await Admin.create({
      name,
      email,
      phone,
      password,
      department,
      employeeId,
      permissions,
      isActive: true,
      isVerified: true,
      isSuperAdmin: true  // First admin = superadmin
    });

    // Send welcome email
    await sendWelcomeEmail(admin.email, admin.name);

    successResponse(res, 'Admin created successfully', {
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        phone: admin.phone,
        role: admin.role,
        department: admin.department,
        employeeId: admin.employeeId,
        isSuperAdmin: admin.isSuperAdmin
      }
    }, 201);

  } catch (error) {
    console.error('Admin Signup Error:', error);
    errorResponse(res, error.message || 'Admin creation failed', 500);
  }
};

// Admin Signin
exports.adminSignin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find admin directly by email
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return errorResponse(res, 'Invalid email or password', 401);
    }

    // Check if active
    if (!admin.isActive) {
      return errorResponse(res, 'Admin account is deactivated', 403);
    }

    // Verify password
    const isValid = await admin.comparePassword(password);
    if (!isValid) {
      return errorResponse(res, 'Invalid email or password', 401);
    }

    // Generate tokens
    const accessToken = jwtHelper.generateAccessToken(admin._id, 'admin');
    const refreshToken = jwtHelper.generateRefreshToken(admin._id);

    // Save refresh token
    await RefreshToken.create({
      userId: admin._id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });

    // Create session
    await Session.create({
      userId: admin._id,
      token: accessToken,
      deviceInfo: req.headers['user-agent'] || 'Unknown',
      ipAddress: req.ip || req.connection.remoteAddress,
      expiresAt:new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

    successResponse(res, 'Admin login successful', {
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        phone: admin.phone,
        department: admin.department,
        employeeId: admin.employeeId,
        permissions: admin.permissions,
        isSuperAdmin: admin.isSuperAdmin
      },
      accessToken,
      refreshToken
    });

  } catch (error) {
    console.error('Admin Signin Error:', error);
    errorResponse(res, error.message || 'Login failed', 500);
  }
};
// Render login page
exports.renderLogin = (req, res) => {
  if (req.cookies.adminToken) {
    return res.redirect('dashboard/index');
  }
  res.render('auth/login', {
    title: 'Admin Login',
    error: null
  });
};


// Get Admin Profile
exports.getAdminProfile = async (req, res) => {
  try {
    // GALAT → req.user._id
    // const admin = await Admin.findById(req.user._id);

    // SAHI → req.admin._id (kyunki protectAdmin middleware req.admin set karta hai)
    const admin = await Admin.findById(req.admin._id);

    if (!admin) {
      return errorResponse(res, 'Admin not found', 404);
    }

    successResponse(res, 'Admin profile retrieved successfully', {
      admin: admin.toJSON()
    });

  } catch (error) {
    console.error('Get Admin Profile Error:', error);
    errorResponse(res, error.message || 'Failed to fetch profile', 500);
  }
};

// Update Admin Profile (FULLY WORKING)
exports.updateAdminProfile = async (req, res) => {
  try {
    const updates = req.body;
    const allowedFields = ['name', 'phone', 'department', 'employeeId']; // jo update karna allowed hai

    // Find admin
    const admin = await Admin.findById(req.admin._id);
    if (!admin) {
      return errorResponse(res, 'Admin not found', 404);
    }

    // Apply only allowed updates
    let hasChanges = false;
    allowedFields.forEach(field => {
      if (updates[field] !== undefined && updates[field] !== admin[field]) {
        admin[field] = updates[field];
        hasChanges = true;
      }
    });

    // Agar kuch change nahi hua to bhi success bhej do (optional)
    if (!hasChanges) {
      return successResponse(res, 'No changes detected', { admin: admin.toJSON() });
    }

    // Save karo
    await admin.save();

    successResponse(res, 'Profile updated successfully!', {
      admin: admin.toJSON()
    });

  } catch (error) {
    console.error('Update Admin Profile Error:', error);
    errorResponse(res, 'Update failed', 500);
  }
};

exports.adminLogout = async (req, res) => {
  try {
    const adminId = req.admin._id; 
    const authHeader = req.headers.authorization;
    let token = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (!token) {
      res.clearCookie('adminToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });
      return successResponse(res, 'Logged out successfully (token not found)');
    }

    await Session.deleteOne({
      userId: adminId,
      token: token
    });

    await RefreshToken.deleteOne({
      userId: adminId,
      token: { $exists: true }
    });

    res.clearCookie('adminToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/'
    });

    return successResponse(res, 'Logged out successfully!');

  } catch (error) {
    console.error('Admin Logout Error:', error);
    return errorResponse(res, 'Logout failed', 500);
  }
};

exports.adminLogoutAll = async (req, res) => {
  try {
    const adminId = req.admin._id;

    await Session.deleteMany({ userId: adminId });

    await RefreshToken.deleteMany({ userId: adminId });   

    res.clearCookie('adminToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/'
    });

    return successResponse(res, 'Logged out from all devices successfully!');

  } catch (error) {
    console.error('Admin Logout All Error:', error);
    return errorResponse(res, 'Failed to logout from all devices', 500);
  }
};

