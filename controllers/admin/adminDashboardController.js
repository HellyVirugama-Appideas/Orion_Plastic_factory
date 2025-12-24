// const User = require('../../models/User');
// const Driver = require('../../models/Driver');
// const Document = require('../../models/Document');
// const { successResponse, errorResponse } = require('../../utils/responseHelper');
// const Session = require('../../models/Session');          
// const RefreshToken = require('../../models/RefreshToken'); 

// // Get Dashboard Statistics
// exports.getDashboardStats = async (req, res) => {
//   try {
//     // Total counts
//     const totalUsers = await User.countDocuments({ role: 'customer', isActive: true });
//     const totalDrivers = await Driver.countDocuments();
//     const totalAdmins = await User.countDocuments({ role: 'admin', isActive: true });

//     // Driver statistics
//     const activeDrivers = await Driver.countDocuments({ isAvailable: true });
//     const approvedDrivers = await Driver.countDocuments({ profileStatus: 'approved' });
//     const pendingDrivers = await Driver.countDocuments({ profileStatus: 'pending_verification' });
//     const rejectedDrivers = await Driver.countDocuments({ profileStatus: 'rejected' });

//     // Document statistics
//     const pendingDocuments = await Document.countDocuments({ status: 'pending' });
//     const verifiedDocuments = await Document.countDocuments({ status: 'verified' });
//     const rejectedDocuments = await Document.countDocuments({ status: 'rejected' });

//     // Recent registrations (last 7 days)
//     const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
//     const recentUsers = await User.countDocuments({
//       role: 'customer',
//       createdAt: { $gte: sevenDaysAgo }
//     });
//     const recentDrivers = await Driver.countDocuments({
//       createdAt: { $gte: sevenDaysAgo }
//     });

//     successResponse(res, 'Dashboard statistics retrieved successfully', {
//       users: {
//         total: totalUsers,
//         recent: recentUsers
//       },
//       drivers: {
//         total: totalDrivers,
//         active: activeDrivers,
//         approved: approvedDrivers,
//         pending: pendingDrivers,
//         rejected: rejectedDrivers,
//         recent: recentDrivers
//       },
//       admins: {
//         total: totalAdmins
//       },
//       documents: {
//         pending: pendingDocuments,
//         verified: verifiedDocuments,
//         rejected: rejectedDocuments
//       }
//     });
//   } catch (error) {
//     errorResponse(res, error.message);
//   }
// };

// // Get All Users (with pagination)
// exports.getAllUsers = async (req, res) => {
//   try {
//     const { page = 1, limit = 10, role, isActive, search } = req.query;

//     // Build query
//     const query = {};
//     if (role) query.role = role;
//     if (isActive !== undefined) query.isActive = isActive === 'true';
//     if (search) {
//       query.$or = [
//         { name: { $regex: search, $options: 'i' } },
//         { email: { $regex: search, $options: 'i' } },
//         { phone: { $regex: search, $options: 'i' } }
//       ];
//     }

//     // Execute query with pagination
//     const users = await User.find(query)
//       .select('-password')
//       .sort({ createdAt: -1 })
//       .limit(limit * 1)
//       .skip((page - 1) * limit);

//     const total = await User.countDocuments(query);

//     successResponse(res, 'Users retrieved successfully', {
//       users,
//       pagination: {
//         total,
//         page: parseInt(page),
//         pages: Math.ceil(total / limit)
//       }
//     });
//   } catch (error) {
//     errorResponse(res, error.message);
//   }
// };

// // Get All Drivers (with pagination)
// exports.getAllDrivers = async (req, res) => {
//   try {
//     const { page = 1, limit = 10, profileStatus, isAvailable, search } = req.query;

//     // Build query
//     const query = {};
//     if (profileStatus) query.profileStatus = profileStatus;
//     if (isAvailable !== undefined) query.isAvailable = isAvailable === 'true';

//     // Search condition
//     if (search) {
//       const searchRegex = new RegExp(search, 'i');
//       query.$or = [
//         { name: searchRegex },
//         { email: searchRegex },
//         { phone: searchRegex },
//         { licenseNumber: searchRegex },
//         { vehicleNumber: searchRegex },
//         { vehicleModel: searchRegex }
//       ];
//     }

//     // Get drivers directly (no populate needed!)
//     const drivers = await Driver.find(query)
//       .select('-password -pin -resetPinToken -resetPinExpires') // sensitive fields hide
//       .sort({ createdAt: -1 })
//       .limit(limit * 1)
//       .skip((page - 1) * limit);

//     const total = await Driver.countDocuments(query);

//     return successResponse(res, 'Drivers retrieved successfully', {
//       drivers,
//       pagination: {
//         total,
//         page: parseInt(page),
//         pages: Math.ceil(total / limit),
//         limit: parseInt(limit)
//       }
//     });

//   } catch (error) {
//     console.error('Get All Drivers Error:', error);
//     return errorResponse(res, error.message || 'Failed to fetch drivers', 500);
//   }
// };

// // Get Single User Details
// exports.getUserDetails = async (req, res) => {
//   try {
//     const { userId } = req.params;

//     const user = await User.findById(userId).select('-password');
//     if (!user) {
//       return errorResponse(res, 'User not found', 404);
//     }

//     // If driver, get driver details
//     let driver = null;
//     if (user.role === 'driver') {
//       driver = await Driver.findOne({ userId: user._id });
//     }

//     successResponse(res, 'User details retrieved successfully', {
//       user,
//       driver
//     });
//   } catch (error) {
//     errorResponse(res, error.message);
//   }
// };

// // Deactivate/Activate User
// exports.toggleUserStatus = async (req, res) => {
//   try {
//     const { userId } = req.params;

//     const user = await User.findById(userId);
//     if (!user) {
//       return errorResponse(res, 'User not found', 404);
//     }

//     // Toggle status
//     user.isActive = !user.isActive;
//     await user.save();

//     // If driver, also update availability
//     if (user.role === 'driver') {
//       await Driver.updateOne(
//         { userId: user._id },
//         { isAvailable: false }
//       );
//     }

//     successResponse(res, `User ${user.isActive ? 'activated' : 'deactivated'} successfully`, {
//       userId: user._id,
//       isActive: user.isActive
//     });
//   } catch (error) {
//     errorResponse(res, error.message);
//   }
// };

// // Delete User
// exports.deleteUser = async (req, res) => {
//   try {
//     const { userId } = req.params;

//     const user = await User.findById(userId);
//     if (!user) {
//       return errorResponse(res, 'User not found', 404);
//     }

//     // Prevent deleting admins
//     if (user.role === 'admin') {
//       return errorResponse(res, 'Cannot delete admin users', 403);
//     }

//     // Agar driver hai to uska saara data delete karo
//     if (user.role === 'driver') {
//       const driver = await Driver.findOne({ userId: user._id });
//       if (driver) {
//         // Ab documents Driver ke andar embedded hain → koi alag collection nahi
//         // Sirf driver delete karne se documents bhi gayab ho jayenge!
//         await Driver.deleteOne({ _id: driver._id });
//       }
//     }

//     // Delete all sessions & refresh tokens
//     await Session.deleteMany({ userId: user._id });
//     await RefreshToken.deleteMany({ userId: user._id });

//     // Finally delete the user
//     await User.deleteOne({ _id: userId });

//     return successResponse(res, 'User and all associated data deleted successfully');

//   } catch (error) {
//     console.error('Delete User Error:', error);
//     return errorResponse(res, error.message || 'Failed to delete user', 500);
//   }
// };

// exports.renderDashboard = async (req, res) => {
//   try {
//     const [
//       totalOrders,
//       totalDeliveries,
//       totalDrivers,
//       totalCustomers,
//       pendingOrders,
//       activeDeliveries,
//       availableDrivers,
//       todayRevenue,
//       recentOrders,
//       activeDeliveriesData
//     ] = await Promise.all([
//       Order.countDocuments(),
//       Delivery.countDocuments(),
//       Driver.countDocuments(),
//       User.countDocuments({ role: 'customer' }),
//       Order.countDocuments({ status: 'pending' }),
//       Delivery.countDocuments({ status: { $in: ['assigned', 'picked_up', 'in_transit', 'out_for_delivery'] } }),
//       Driver.countDocuments({ isAvailable: true }),
//       Order.aggregate([
//         {
//           $match: {
//             createdAt: {
//               $gte: new Date(new Date().setHours(0, 0, 0, 0))
//             },
//             status: { $ne: 'cancelled' }
//           }
//         },
//         {
//           $group: {
//             _id: null,
//             total: { $sum: '$totalAmount' }
//           }
//         }
//       ]),
//       Order.find()
//         .populate('customerId', 'name email')
//         .populate('deliveryId', 'trackingNumber status')
//         .sort({ createdAt: -1 })
//         .limit(10),
//       Delivery.find({ status: { $in: ['assigned', 'picked_up', 'in_transit', 'out_for_delivery'] } })
//         .populate('customerId', 'name phone')
//         .populate('driverId')
//         .limit(10)
//     ]);

//     const orderStatusBreakdown = await Order.aggregate([
//       { $group: { _id: '$status', count: { $sum: 1 } } }
//     ]);

//     const deliveryStatusBreakdown = await Delivery.aggregate([
//       { $group: { _id: '$status', count: { $sum: 1 } } }
//     ]);

//     res.render('admin/dashboard/index', {
//       title: 'Dashboard',
//       user: req.admin,
//       stats: {
//         totalOrders,
//         totalDeliveries,
//         totalDrivers,
//         totalCustomers,
//         pendingOrders,
//         activeDeliveries,
//         availableDrivers,
//         todayRevenue: todayRevenue[0]?.total || 0
//       },
//       orderStatusBreakdown,
//       deliveryStatusBreakdown,
//       recentOrders,
//       activeDeliveries: activeDeliveriesData,
//       success: req.query.success,
//       error: req.query.error
//     });
//   } catch (error) {
//     console.error('Dashboard Error:', error);
//     res.render('admin/dashboard/index', {
//       title: 'Dashboard',
//       user: req.admin,
//       error: 'Failed to load dashboard data'
//     });
//   }
// };



const Order = require('../../models/Order');
const Delivery = require('../../models/Delivery');
const Driver = require('../../models/Driver');
const Customer = require('../../models/Customer');

// Render dashboard
// exports.renderDashboard = async (req, res) => {
//   try {
//     // Fetch stats in parallel
//     const [
//       totalOrders,
//       totalDeliveries,
//       totalDrivers,
//       totalCustomers,
//       pendingOrders,
//       activeDeliveries,
//       availableDrivers,
//       recentOrders,
//       activeDeliveriesList,
//       orderStatusBreakdown,
//       deliveryStatusBreakdown
//     ] = await Promise.all([
//       Order.countDocuments(),
//       Delivery.countDocuments(),
//       Driver.countDocuments(),
//       Customer.countDocuments(),
//       Order.countDocuments({ status: 'pending' }),
//       Delivery.countDocuments({ status: { $in: ['in_transit', 'out_for_delivery'] } }),
//       Driver.countDocuments({ status: 'available' }),
//       Order.find().populate('customerId').sort({ createdAt: -1 }).limit(10),
//       Delivery.find({ status: { $in: ['in_transit', 'out_for_delivery'] } })
//         .populate('driverId orderId')
//         .limit(10),
//       Order.aggregate([
//         { $group: { _id: '$status', count: { $sum: 1 } } }
//       ]),
//       Delivery.aggregate([
//         { $group: { _id: '$status', count: { $sum: 1 } } }
//       ])
//     ]);

//     // Calculate today's revenue
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);
//     const todayRevenue = await Order.aggregate([
//       {
//         $match: {
//           status: 'delivered',
//           updatedAt: { $gte: today }
//         }
//       },
//       {
//         $group: {
//           _id: null,
//           total: { $sum: '$totalAmount' }
//         }
//       }
//     ]);

//     res.render('index', {
//       title: 'Dashboard',
//       user: req.admin,
//       stats: {
//         totalOrders,
//         totalDeliveries,
//         totalDrivers,
//         totalCustomers,
//         pendingOrders,
//         activeDeliveries,
//         availableDrivers,
//         todayRevenue: todayRevenue[0]?.total || 0
//       },
//       recentOrders,
//       activeDeliveries: activeDeliveriesList,
//       orderStatusBreakdown,
//       deliveryStatusBreakdown
//     });
//   } catch (error) {
//     console.error('Dashboard render error:', error);
//     res.render('index', {
//       title: 'Dashboard',
//       user: req.admin,
//       stats: {},
//       recentOrders: [],
//       activeDeliveries: [],
//       orderStatusBreakdown: [],
//       deliveryStatusBreakdown: [],
//       error: 'Failed to load dashboard data'
//     });
//   }
// };
// Render dashboard
exports.renderDashboard = async (req, res) => {
  try {
    // Fetch stats in parallel (tumhara code same)
    const [
      totalOrders,
      totalDeliveries,
      totalDrivers,
      totalCustomers,
      pendingOrders,
      activeDeliveries,
      availableDrivers,
      recentOrders,
      activeDeliveriesList,
      orderStatusBreakdown,
      deliveryStatusBreakdown
    ] = await Promise.all([
      Order.countDocuments(),
      Delivery.countDocuments(),
      Driver.countDocuments(),
      Customer.countDocuments(),
      Order.countDocuments({ status: 'pending' }),
      Delivery.countDocuments({ status: { $in: ['in_transit', 'out_for_delivery'] } }),
      Driver.countDocuments({ status: 'available' }),
      Order.find().populate('customerId').sort({ createdAt: -1 }).limit(10),
      Delivery.find({ status: { $in: ['in_transit', 'out_for_delivery'] } })
        .populate('driverId orderId')
        .limit(10),
      Order.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Delivery.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ])
    ]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayRevenue = await Order.aggregate([
      {
        $match: {
          status: 'delivered',
          updatedAt: { $gte: today }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalAmount' }
        }
      }
    ]);

    // YE LINE ADD KARO – sidenavbar ko current url batao
    const currentUrl = req.originalUrl || req.url;

    res.render('index', {
      title: 'Dashboard',
      user: req.admin,
      url: currentUrl,  // ← YE ADD KARO (sidenavbar ke liye)
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
      recentOrders,
      activeDeliveries: activeDeliveriesList,
      orderStatusBreakdown,
      deliveryStatusBreakdown
    });
  } catch (error) {
    console.error('Dashboard render error:', error);
    
    const currentUrl = req.originalUrl || req.url;
    
    res.render('index', {
      title: 'Dashboard',
      user: req.admin,
      url: currentUrl,  // ← error case me bhi pass kar do
      stats: {},
      recentOrders: [],
      activeDeliveries: [],
      orderStatusBreakdown: [],
      deliveryStatusBreakdown: [],
      error: 'Failed to load dashboard data'
    });
  }
};

// Render orders list
exports.renderOrdersList = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;
    
    // Build filter query
    const filter = {};
    if (req.query.search) {
      filter.$or = [
        { orderNumber: { $regex: req.query.search, $options: 'i' } }
      ];
    }
    if (req.query.status) {
      filter.status = req.query.status;
    }
    if (req.query.priority) {
      filter.priority = req.query.priority;
    }
    
    const [orders, totalOrders] = await Promise.all([
      Order.find(filter)
        .populate('customerId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Order.countDocuments(filter)
    ]);
    
    const totalPages = Math.ceil(totalOrders / limit);
    
    res.render('admin/orders/list', {
      title: 'Orders',
      user: req.admin,
      orders,
      currentPage: page,
      totalPages,
      filters: req.query
    });
  } catch (error) {
    console.error('Orders list error:', error);
    res.status(500).render('admin/orders/list', {
      title: 'Orders',
      user: req.admin,
      orders: [],
      currentPage: 1,
      totalPages: 1,
      filters: {},
      error: 'Failed to load orders'
    });
  }
};

// Render order details
exports.renderOrderDetails = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customerId')
      .populate('deliveryId');
    
    if (!order) {
      return res.redirect('/admin/orders?error=Order not found');
    }
    
    res.render('admin/orders/details', {
      title: `Order ${order.orderNumber}`,
      user: req.admin,
      order
    });
  } catch (error) {
    console.error('Order details error:', error);
    res.redirect('/admin/orders?error=Failed to load order');
  }
};

// Render create order form
exports.renderCreateOrder = async (req, res) => {
  try {
    const customers = await Customer.find({ status: 'active' }).sort({ name: 1 });
    
    res.render('admin/orders/create', {
      title: 'Create Order',
      user: req.admin,
      customers
    });
  } catch (error) {
    console.error('Create order render error:', error);
    res.redirect('/admin/orders?error=Failed to load form');
  }
};

// Render deliveries list
exports.renderDeliveriesList = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;
    
    // Build filter query
    const filter = {};
    if (req.query.search) {
      filter.trackingNumber = { $regex: req.query.search, $options: 'i' };
    }
    if (req.query.status) {
      filter.status = req.query.status;
    }
    if (req.query.driver) {
      filter.driverId = req.query.driver;
    }
    if (req.query.startDate) {
      filter.scheduledDate = { $gte: new Date(req.query.startDate) };
    }
    
    const [deliveries, totalDeliveries, drivers] = await Promise.all([
      Delivery.find(filter)
        .populate('driverId orderId')
        .populate({
          path: 'orderId',
          populate: { path: 'customerId' }
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Delivery.countDocuments(filter),
      Driver.find({ status: 'active' }).sort({ name: 1 })
    ]);
    
    // Calculate stats
    const stats = {
      pending: await Delivery.countDocuments({ status: 'pending' }),
      inTransit: await Delivery.countDocuments({ status: 'in_transit' }),
      outForDelivery: await Delivery.countDocuments({ status: 'out_for_delivery' }),
      delivered: await Delivery.countDocuments({
        status: 'delivered',
        updatedAt: { $gte: new Date().setHours(0, 0, 0, 0) }
      })
    };
    
    const totalPages = Math.ceil(totalDeliveries / limit);
    
    res.render('admin/deliveries/list', {
      title: 'Deliveries',
      user: req.admin,
      deliveries,
      drivers,
      stats,
      currentPage: page,
      totalPages,
      filters: req.query
    });
  } catch (error) {
    console.error('Deliveries list error:', error);
    res.status(500).render('admin/deliveries/list', {
      title: 'Deliveries',
      user: req.admin,
      deliveries: [],
      drivers: [],
      stats: {},
      currentPage: 1,
      totalPages: 1,
      filters: {},
      error: 'Failed to load deliveries'
    });
  }
};

// Render delivery details
exports.renderDeliveryDetails = async (req, res) => {
  try {
    const delivery = await Delivery.findById(req.params.id)
      .populate('driverId orderId')
      .populate({
        path: 'orderId',
        populate: { path: 'customerId' }
      });
    
    if (!delivery) {
      return res.redirect('/admin/deliveries?error=Delivery not found');
    }
    
    res.render('admin/deliveries/details', {
      title: `Delivery ${delivery.trackingNumber}`,
      user: req.admin,
      delivery
    });
  } catch (error) {
    console.error('Delivery details error:', error);
    res.redirect('/admin/deliveries?error=Failed to load delivery');
  }
};

// Render live tracking
exports.renderLiveTracking = async (req, res) => {
  try {
    const activeDeliveries = await Delivery.find({
      status: { $in: ['assigned', 'picked_up', 'in_transit', 'out_for_delivery'] }
    })
      .populate('driverId orderId')
      .populate({
        path: 'orderId',
        populate: { path: 'customerId' }
      })
      .sort({ updatedAt: -1 });
    
    res.render('admin/tracking/live', {
      title: 'Live Tracking',
      user: req.admin,
      activeDeliveries
    });
  } catch (error) {
    console.error('Live tracking error:', error);
    res.status(500).render('admin/tracking/live', {
      title: 'Live Tracking',
      user: req.admin,
      activeDeliveries: [],
      error: 'Failed to load tracking data'
    });
  }
};

// Render drivers list
exports.renderDriversList = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;
    
    const filter = {};
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } },
        { phoneNumber: { $regex: req.query.search, $options: 'i' } }
      ];
    }
    if (req.query.status) {
      filter.status = req.query.status;
    }
    
    const [drivers, totalDrivers] = await Promise.all([
      Driver.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Driver.countDocuments(filter)
    ]);
    
    const totalPages = Math.ceil(totalDrivers / limit);
    
    res.render('admin/drivers/list', {
      title: 'Drivers',
      user: req.admin,
      drivers,
      currentPage: page,
      totalPages,
      filters: req.query
    });
  } catch (error) {
    console.error('Drivers list error:', error);
    res.status(500).render('admin/drivers/list', {
      title: 'Drivers',
      user: req.admin,
      drivers: [],
      currentPage: 1,
      totalPages: 1,
      filters: {},
      error: 'Failed to load drivers'
    });
  }
};

// Render driver details
exports.renderDriverDetails = async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);
    
    if (!driver) {
      return res.redirect('/admin/drivers?error=Driver not found');
    }
    
    // Get driver's delivery stats
    const [totalDeliveries, completedDeliveries, activeDeliveries, recentDeliveries] = await Promise.all([
      Delivery.countDocuments({ driverId: driver._id }),
      Delivery.countDocuments({ driverId: driver._id, status: 'delivered' }),
      Delivery.find({ driverId: driver._id, status: { $in: ['assigned', 'picked_up', 'in_transit', 'out_for_delivery'] } })
        .populate('orderId'),
      Delivery.find({ driverId: driver._id })
        .populate('orderId')
        .sort({ createdAt: -1 })
        .limit(10)
    ]);
    
    res.render('admin/drivers/details', {
      title: `Driver - ${driver.name}`,
      user: req.admin,
      driver,
      stats: {
        totalDeliveries,
        completedDeliveries,
        activeDeliveries: activeDeliveries.length
      },
      activeDeliveries,
      recentDeliveries
    });
  } catch (error) {
    console.error('Driver details error:', error);
    res.redirect('/admin/drivers?error=Failed to load driver');
  }
};

// Render customers list
exports.renderCustomersList = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;
    
    const filter = {};
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } },
        { phoneNumber: { $regex: req.query.search, $options: 'i' } }
      ];
    }
    if (req.query.status) {
      filter.status = req.query.status;
    }
    
    const [customers, totalCustomers] = await Promise.all([
      Customer.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Customer.countDocuments(filter)
    ]);
    
    const totalPages = Math.ceil(totalCustomers / limit);
    
    res.render('admin/customers/list', {
      title: 'Customers',
      user: req.admin,
      customers,
      currentPage: page,
      totalPages,
      filters: req.query
    });
  } catch (error) {
    console.error('Customers list error:', error);
    res.status(500).render('admin/customers/list', {
      title: 'Customers',
      user: req.admin,
      customers: [],
      currentPage: 1,
      totalPages: 1,
      filters: {},
      error: 'Failed to load customers'
    });
  }
};

// API endpoint for active deliveries (for live tracking refresh)
exports.getActiveDeliveries = async (req, res) => {
  try {
    const activeDeliveries = await Delivery.find({
      status: { $in: ['assigned', 'picked_up', 'in_transit', 'out_for_delivery'] }
    })
      .populate('driverId orderId')
      .populate({
        path: 'orderId',
        populate: { path: 'customerId' }
      })
      .sort({ updatedAt: -1 });
    
    res.json({ success: true, deliveries: activeDeliveries });
  } catch (error) {
    console.error('Get active deliveries error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch deliveries' });
  }
};