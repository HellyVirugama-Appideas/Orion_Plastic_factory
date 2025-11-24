const User = require('../../models/User');
const Driver = require('../../models/Driver');
const Document = require('../../models/Document');
const { successResponse, errorResponse } = require('../../utils/responseHelper');
const Session = require('../../models/Session');          
const RefreshToken = require('../../models/RefreshToken'); 

// Get Dashboard Statistics
exports.getDashboardStats = async (req, res) => {
  try {
    // Total counts
    const totalUsers = await User.countDocuments({ role: 'customer', isActive: true });
    const totalDrivers = await Driver.countDocuments();
    const totalAdmins = await User.countDocuments({ role: 'admin', isActive: true });

    // Driver statistics
    const activeDrivers = await Driver.countDocuments({ isAvailable: true });
    const approvedDrivers = await Driver.countDocuments({ profileStatus: 'approved' });
    const pendingDrivers = await Driver.countDocuments({ profileStatus: 'pending_verification' });
    const rejectedDrivers = await Driver.countDocuments({ profileStatus: 'rejected' });

    // Document statistics
    const pendingDocuments = await Document.countDocuments({ status: 'pending' });
    const verifiedDocuments = await Document.countDocuments({ status: 'verified' });
    const rejectedDocuments = await Document.countDocuments({ status: 'rejected' });

    // Recent registrations (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentUsers = await User.countDocuments({
      role: 'customer',
      createdAt: { $gte: sevenDaysAgo }
    });
    const recentDrivers = await Driver.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });

    successResponse(res, 'Dashboard statistics retrieved successfully', {
      users: {
        total: totalUsers,
        recent: recentUsers
      },
      drivers: {
        total: totalDrivers,
        active: activeDrivers,
        approved: approvedDrivers,
        pending: pendingDrivers,
        rejected: rejectedDrivers,
        recent: recentDrivers
      },
      admins: {
        total: totalAdmins
      },
      documents: {
        pending: pendingDocuments,
        verified: verifiedDocuments,
        rejected: rejectedDocuments
      }
    });
  } catch (error) {
    errorResponse(res, error.message);
  }
};

// Get All Users (with pagination)
exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, role, isActive, search } = req.query;

    // Build query
    const query = {};
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    // Execute query with pagination
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    successResponse(res, 'Users retrieved successfully', {
      users,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    errorResponse(res, error.message);
  }
};

// Get All Drivers (with pagination)
exports.getAllDrivers = async (req, res) => {
  try {
    const { page = 1, limit = 10, profileStatus, isAvailable, search } = req.query;

    // Build query
    const query = {};
    if (profileStatus) query.profileStatus = profileStatus;
    if (isAvailable !== undefined) query.isAvailable = isAvailable === 'true';

    // Search condition
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { licenseNumber: searchRegex },
        { vehicleNumber: searchRegex },
        { vehicleModel: searchRegex }
      ];
    }

    // Get drivers directly (no populate needed!)
    const drivers = await Driver.find(query)
      .select('-password -pin -resetPinToken -resetPinExpires') // sensitive fields hide
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Driver.countDocuments(query);

    return successResponse(res, 'Drivers retrieved successfully', {
      drivers,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get All Drivers Error:', error);
    return errorResponse(res, error.message || 'Failed to fetch drivers', 500);
  }
};

// Get Single User Details
exports.getUserDetails = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    // If driver, get driver details
    let driver = null;
    if (user.role === 'driver') {
      driver = await Driver.findOne({ userId: user._id });
    }

    successResponse(res, 'User details retrieved successfully', {
      user,
      driver
    });
  } catch (error) {
    errorResponse(res, error.message);
  }
};

// Deactivate/Activate User
exports.toggleUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    // Toggle status
    user.isActive = !user.isActive;
    await user.save();

    // If driver, also update availability
    if (user.role === 'driver') {
      await Driver.updateOne(
        { userId: user._id },
        { isAvailable: false }
      );
    }

    successResponse(res, `User ${user.isActive ? 'activated' : 'deactivated'} successfully`, {
      userId: user._id,
      isActive: user.isActive
    });
  } catch (error) {
    errorResponse(res, error.message);
  }
};

// Delete User
exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    // Prevent deleting admins
    if (user.role === 'admin') {
      return errorResponse(res, 'Cannot delete admin users', 403);
    }

    // Agar driver hai to uska saara data delete karo
    if (user.role === 'driver') {
      const driver = await Driver.findOne({ userId: user._id });
      if (driver) {
        // Ab documents Driver ke andar embedded hain → koi alag collection nahi
        // Sirf driver delete karne se documents bhi gayab ho jayenge!
        await Driver.deleteOne({ _id: driver._id });
      }
    }

    // Delete all sessions & refresh tokens
    await Session.deleteMany({ userId: user._id });
    await RefreshToken.deleteMany({ userId: user._id });

    // Finally delete the user
    await User.deleteOne({ _id: userId });

    return successResponse(res, 'User and all associated data deleted successfully');

  } catch (error) {
    console.error('Delete User Error:', error);
    return errorResponse(res, error.message || 'Failed to delete user', 500);
  }
};

exports.renderDashboard = async (req, res) => {
  try {
    // Get statistics
    const [
      totalOrders,
      totalDeliveries,
      totalDrivers,
      totalCustomers,
      pendingOrders,
      activeDeliveries,
      availableDrivers,
      todayRevenue,
      recentOrders,
      activeDeliveriesData
    ] = await Promise.all([
      Order.countDocuments(),
      Delivery.countDocuments(),
      Driver.countDocuments(),
      User.countDocuments({ role: 'customer' }),
      Order.countDocuments({ status: 'pending' }),
      Delivery.countDocuments({ status: { $in: ['assigned', 'picked_up', 'in_transit', 'out_for_delivery'] } }),
      Driver.countDocuments({ isAvailable: true }),
      Order.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(new Date().setHours(0, 0, 0, 0))
            },
            status: { $ne: 'cancelled' }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$totalAmount' }
          }
        }
      ]),
      Order.find()
        .populate('customerId', 'name email')
        .populate('deliveryId', 'trackingNumber status')
        .sort({ createdAt: -1 })
        .limit(10),
      Delivery.find({ status: { $in: ['assigned', 'picked_up', 'in_transit', 'out_for_delivery'] } })
        .populate('customerId', 'name phone')
        .populate('driverId')
        .limit(10)
    ]);

    // Get order status breakdown
    const orderStatusBreakdown = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Get delivery status breakdown
    const deliveryStatusBreakdown = await Delivery.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    res.render('admin/dashboard/index', {
      title: 'Dashboard',
      user: req.user,
      stats: {
        totalOrders,
        totalDeliveries,
        totalDrivers,
        totalCustomers,
        pendingOrders,
        activeDeliveries,
        availableDrivers,
        todayRevenue: todayRevenue[0]?.total || 0
      },
      orderStatusBreakdown,
      deliveryStatusBreakdown,
      recentOrders,
      activeDeliveries: activeDeliveriesData
    });
  } catch (error) {
    console.error('Dashboard Error:', error);
    res.render('admin/dashboard/index', {
      title: 'Dashboard',
      user: req.user,
      error: 'Failed to load dashboard data'
    });
  }
};