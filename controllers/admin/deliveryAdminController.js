const Delivery = require('../../models/Delivery');
const Route = require('../../models/Route');
const Driver = require('../../models/Driver');
const DeliveryStatusHistory = require('../../models/DeliveryStatusHistory');
const User = require("../../models/User")
const { successResponse, errorResponse } = require('../../utils/responseHelper');


// Create Delivery (Admin Only)
exports.createDelivery = async (req, res) => {
  try {
    const {
      orderId,
      customerId,
      pickupLocation,
      deliveryLocation,
      packageDetails = {},
      scheduledPickupTime,
      scheduledDeliveryTime,
      priority = 'medium',
      instructions
    } = req.body;

    // 1. Required fields check
    if (!orderId || !customerId || !pickupLocation || !deliveryLocation) {
      return errorResponse(res, 'Missing required fields', 400);
    }

    // 2. Check if delivery already exists
    const existing = await Delivery.findOne({ orderId });
    if (existing) return errorResponse(res, 'Delivery already exists for this order', 400);

    const finalPackageDetails = {
      items: packageDetails.items || [],
      weight: Number(packageDetails.weight) || 0,
      dimensions: packageDetails.dimensions
        ? {
            length: Number(packageDetails.dimensions.split('x')[0]) || 0,
            width: Number(packageDetails.dimensions.split('x')[1]) || 0,
            height: Number(packageDetails.dimensions.split('x')[2]) || 0,
            unit: packageDetails.dimensions.includes('cm') ? 'cm' : 'inch'
          }
        : { length: 0, width: 0, height: 0, unit: 'cm' }
    };

    // 4. Generate Tracking Number (DEL + Date + Random)
    const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const random = Math.floor(1000 + Math.random() * 9000);
    const trackingNumber = `DEL${dateStr}${random}`;

    // 5. Admin info 
    const adminId = req.user?._id || null;

    // 6. Create Delivery 
    const delivery = await Delivery.create({
      orderId,
      customerId,
      pickupLocation,
      deliveryLocation,
      packageDetails: finalPackageDetails,
      scheduledPickupTime: scheduledPickupTime ? new Date(scheduledPickupTime) : null,
      scheduledDeliveryTime: scheduledDeliveryTime ? new Date(scheduledDeliveryTime) : null,
      priority,
      instructions,
      trackingNumber,           
      createdBy: adminId,      
      status: 'pending'
    });

    // 7. Status History
    await DeliveryStatusHistory.create({
      deliveryId: delivery._id,
      status: 'pending',
      remarks: 'Delivery created by admin',
      updatedBy: {
        userId: adminId,
        userRole: req.user?.role || 'admin',
        userName: req.user?.name || 'Admin'
      }
    });

    const trackingUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/track/${trackingNumber}`;

    return successResponse(res, 'Delivery created successfully!', {
      delivery,
      trackingUrl
    }, 201);
    // res.redirect(`/admin/deliveries/${delivery._id}?success=Delivery created successfully`);

  } catch (error) {
    console.error('Create Delivery Error:', error.message);
    return errorResponse(res, error.message || 'Failed to create delivery', 500);
    //  res.redirect('/admin/deliveries/create?error=Failed to create delivery');
  }
};

// Assign Driver to Deliver
// exports.assignDriver = async (req, res) => {
//   try {
//     const { deliveryId } = req.params;
//     let { driverId } = req.body;

//     if (!driverId) return errorResponse(res, 'Driver ID is required', 400);

//     driverId = driverId.trim();

//     const delivery = await Delivery.findById(deliveryId);
//     if (!delivery) return errorResponse(res, 'Delivery not found', 404);
//     if (delivery.status !== 'pending') return errorResponse(res, 'Delivery already assigned', 400);

//     const driver = await Driver.findById(driverId);
//     if (!driver) {
//       return errorResponse(res, `Driver not found with ID: ${driverId}`, 404);
//     }

//     if (!driver.isAvailable) return errorResponse(res, 'Driver is not available', 400);
//     if (driver.profileStatus !== 'approved') return errorResponse(res, 'Driver profile not approved', 400);

//     delivery.driverId = driver._id;
//     delivery.vehicleNumber = driver.vehicleNumber;
//     delivery.status = 'pending_acception';
//     await delivery.save();

//     driver.isAvailable = false;
//     await driver.save();

//     await DeliveryStatusHistory.create({
//       deliveryId: delivery._id,
//       status: 'assigned',
//       remarks: `Assigned to ${driver.name} (${driver.vehicleNumber})`,
//       updatedBy: {
//         userId: req.user?._id || null,
//         userRole: req.user?.role || 'admin',
//         userName: req.user?.name || 'Admin'
//       }
//     });

//     return successResponse(res, 'Driver assigned successfully!', {
//       delivery,
//       driver: {
//         id: driver._id,
//         name: driver.name,
//         phone: driver.phone,
//         vehicleNumber: driver.vehicleNumber
//       }
//     });

//   } catch (error) {
//     // Yeh error message se pata chalega kahan galti hai
//     console.error('Assign Driver Error:', error.message);
//     if (error.kind === 'ObjectId') {
//       return errorResponse(res, `Invalid Driver ID format: ${req.body.driverId}`, 400);
//     }
//     return errorResponse(res, error.message || 'Failed to assign driver', 500);
//   }
// }; 

exports.assignDriver = async (req, res) => {
  try {
    const { deliveryId } = req.params;
    let { driverId } = req.body;

    if (!driverId) return errorResponse(res, 'Driver ID is required', 400);
    driverId = driverId.trim();

    // 1. Delivery check
    const delivery = await Delivery.findById(deliveryId);
    if (!delivery) return errorResponse(res, 'Delivery not found', 404);

    // Allow only if it's pending (not already assigned or in progress)
    if (delivery.status !== 'pending') {
      return errorResponse(res, 'Delivery is not in pending state. Cannot assign.', 400);
    }

    // 2. Driver check
    const driver = await Driver.findById(driverId);
    if (!driver) {
      return errorResponse(res, `Driver not found with ID: ${driverId}`, 404);
    }
    if (!driver.isAvailable) {
      return errorResponse(res, 'Driver is currently not available', 400);
    }
    if (driver.profileStatus !== 'approved') {
      return errorResponse(res, 'Driver profile is not approved yet', 400);
    }

    // 3. ASSIGN DRIVER + SET STATUS TO pending_acceptance
    delivery.driverId = driver._id;
    delivery.vehicleNumber = driver.vehicleNumber;
    delivery.status = 'assigned';  

    await delivery.save();

    // 4. Block driver (not available for other deliveries)
    driver.isAvailable = false;
    await driver.save();

    // 5. Add to status history
    await DeliveryStatusHistory.create({
      deliveryId: delivery._id,
      status: 'assigned',
      remarks: `Delivery assigned to ${driver.name} (${driver.vehicleNumber}) — Awaiting driver acceptance`,
      updatedBy: {
        userId: req.user?._id || null,
        userRole: req.user?.role || 'admin',
        userName: req.user?.name || 'Admin'
      }
    });

    // 6. Success Response
    return successResponse(res, 'Driver assigned successfully! Waiting for driver to accept.', {
      delivery: {
        _id: delivery._id,
        trackingNumber: delivery.trackingNumber,
        status: delivery.status, // ← pending_acceptance
        driverId: delivery.driverId
      },
      driver: {
        id: driver._id,
        name: driver.name,
        phone: driver.phone,
        vehicleNumber: driver.vehicleNumber
      }
    });

  } catch (error) {
    console.error('Assign Driver Error:', error.message);
    if (error.kind === 'ObjectId') {
      return errorResponse(res, `Invalid Driver ID format`, 400);
    }
    return errorResponse(res, error.message || 'Failed to assign driver', 500);
  }
};

// Assign Multiple Deliveries to Driver
exports.assignMultipleDeliveries = async (req, res) => {
  try {
    const { driverId, deliveryIds } = req.body;

    if (!driverId || !deliveryIds || !Array.isArray(deliveryIds) || deliveryIds.length === 0) {
      return errorResponse(res, 'Driver ID and delivery IDs are required', 400);
    }

    // Get driver
    const driver = await Driver.findById(driverId).populate('userId');
    if (!driver) {
      return errorResponse(res, 'Driver not found', 404);
    }

    if (!driver.isAvailable || driver.profileStatus !== 'approved') {
      return errorResponse(res, 'Driver is not available or not approved', 400);
    }

    // Get all deliveries
    const deliveries = await Delivery.find({
      _id: { $in: deliveryIds },
      status: 'pending'
    });

    if (deliveries.length !== deliveryIds.length) {
      return errorResponse(res, 'Some deliveries are not found or already assigned', 400);
    }

    // Update all deliveries
    const updatePromises = deliveries.map(async (delivery) => {
      delivery.driverId = driver._id;
      delivery.vehicleNumber = driver.vehicleNumber;
      delivery.status = 'assigned';
      await delivery.save();

      // Create status history
      await DeliveryStatusHistory.create({
        deliveryId: delivery._id,
        status: 'assigned',
        remarks: `Assigned to driver: ${driver.userId.name}`,
        updatedBy: {
          userId: req.user._id,
          userRole: 'admin',
          userName: req.user.name
        }
      });
    });

    await Promise.all(updatePromises);

    return successResponse(res, `${deliveries.length} deliveries assigned successfully`, {
      assignedCount: deliveries.length,
      driver: {
        id: driver._id,
        name: driver.userId.name,
        phone: driver.userId.phone
      }
    });

  } catch (error) {
    console.error('Assign Multiple Deliveries Error:', error);
    return errorResponse(res, error.message || 'Failed to assign deliveries', 500);
  }
};

// Get All Deliveries (Admin)
exports.getAllDeliveries = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, driverId, search } = req.query;

    const query = { };
    if (status) query.status = status;
    if (driverId) query.driverId = driverId;
    if (search) {
      query.$or = [
        { trackingNumber: { $regex: search, $options: 'i' } },
        { orderId: { $regex: search, $options: 'i' } }
      ];
    }

    const deliveries = await Delivery.find(query)
      .populate('customerId', 'name email phone companyName')
      .populate('driverId', 'name phone vehicleNumber vehicleType profileImage rating') // ← FIXED!
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean(); 
    const total = await Delivery.countDocuments(query);

    // Clean & beautiful response
    const formattedDeliveries = deliveries.map(d => ({
      id: d._id,
      trackingNumber: d.trackingNumber,
      status: d.status,
      priority: d.priority,
      createdAt: d.createdAt,
      customer: d.customerId ? {
        name: d.customerId.name,
        phone: d.customerId.phone,
        email: d.customerId.email
      } : null,
      driver: d.driverId ? {
        id: d.driverId._id,
        name: d.driverId.name,
        phone: d.driverId.phone,
        vehicle: d.driverId.vehicleNumber
      } : null,
      createdBy: d.createdBy ? d.createdBy.name : 'System'
    }));

    return successResponse(res, 'Deliveries retrieved successfully', {
      deliveries: formattedDeliveries,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get All Deliveries Error:', error.message);
    return errorResponse(res, 'Failed to retrieve deliveries', 500);
  }
};

// Get Delivery Details
exports.getDeliveryDetails = async (req, res) => {
  try {
    const { deliveryId } = req.params;

    // Validate ObjectId format (safety first)
    if (!/^[0-9a-fA-F]{24}$/.test(deliveryId)) {
      return errorResponse(res, 'Invalid delivery ID format', 400);
    }

    const delivery = await Delivery.findById(deliveryId)
      .populate('customerId', 'name email phone companyName')
      .populate('driverId', 'name phone vehicleNumber vehicleType profileImage rating') // ← SAB DRIVER MEIN HI HAI!
      .populate('createdBy', 'name email department');

    if (!delivery) {
      return errorResponse(res, 'Delivery not found', 404);
    }

    // Get status history
    const statusHistory = await DeliveryStatusHistory.find({ deliveryId })
      .sort({ timestamp: -1 })
      .populate('updatedBy.userId', 'name') // agar updatedBy mein userId hai to
      .select('status remarks timestamp location');

    // Clean response
    const response = {
      delivery: {
        id: delivery._id,
        trackingNumber: delivery.trackingNumber,
        status: delivery.status,
        pickupLocation: delivery.pickupLocation,
        deliveryLocation: delivery.deliveryLocation,
        scheduledPickupTime: delivery.scheduledPickupTime,
        scheduledDeliveryTime: delivery.scheduledDeliveryTime,
        actualPickupTime: delivery.actualPickupTime,
        actualDeliveryTime: delivery.actualDeliveryTime,
        priority: delivery.priority,
        totalAmount: delivery.totalAmount,
        paymentStatus: delivery.paymentDetails?.status || 'pending',
        createdAt: delivery.createdAt,
        createdBy: delivery.createdBy ? {
          name: delivery.createdBy.name,
          email: delivery.createdBy.email,
          department: delivery.createdBy.department
        } : null,
        customer: delivery.customerId ? {
          name: delivery.customerId.name,
          phone: delivery.customerId.phone,
          email: delivery.customerId.email,
          company: delivery.customerId.companyName || null
        } : null,
        driver: delivery.driverId ? {
          id: delivery.driverId._id,
          name: delivery.driverId.name,
          phone: delivery.driverId.phone,
          vehicleNumber: delivery.driverId.vehicleNumber,
          vehicleType: delivery.driverId.vehicleType,
          profileImage: delivery.driverId.profileImage || null,
          rating: delivery.driverId.rating || 0
        } : null
      },
      statusHistory
    };

    return successResponse(res, 'Delivery details retrieved successfully!', response);

  } catch (error) {
    console.error('Get Delivery Details Error:', error.message);

    if (error.name === 'CastError') {
      return errorResponse(res, 'Invalid delivery ID', 400);
    }

    return errorResponse(res, 'Failed to retrieve delivery details', 500);
  }
};

// Get Delivery Details
exports.getDeliveryDetails = async (req, res) => {
  try {
    const { deliveryId } = req.params;

    // Validate ObjectId format (safety first)
    if (!/^[0-9a-fA-F]{24}$/.test(deliveryId)) {
      return errorResponse(res, 'Invalid delivery ID format', 400);
    }

    const delivery = await Delivery.findById(deliveryId)
      .populate('customerId', 'name email phone companyName')
      .populate('driverId', 'name phone vehicleNumber vehicleType profileImage rating') // ← SAB DRIVER MEIN HI HAI!
      .populate('createdBy', 'name email department');

    if (!delivery) {
      return errorResponse(res, 'Delivery not found', 404);
    }

    // Get status history
    const statusHistory = await DeliveryStatusHistory.find({ deliveryId })
      .sort({ timestamp: -1 })
      .populate('updatedBy.userId', 'name') // agar updatedBy mein userId hai to
      .select('status remarks timestamp location');

    // Clean response
    const response = {
      delivery: {
        id: delivery._id,
        trackingNumber: delivery.trackingNumber,
        status: delivery.status,
        pickupLocation: delivery.pickupLocation,
        deliveryLocation: delivery.deliveryLocation,
        scheduledPickupTime: delivery.scheduledPickupTime,
        scheduledDeliveryTime: delivery.scheduledDeliveryTime,
        actualPickupTime: delivery.actualPickupTime,
        actualDeliveryTime: delivery.actualDeliveryTime,
        priority: delivery.priority,
        totalAmount: delivery.totalAmount,
        paymentStatus: delivery.paymentDetails?.status || 'pending',
        createdAt: delivery.createdAt,
        createdBy: delivery.createdBy ? {
          name: delivery.createdBy.name,
          email: delivery.createdBy.email,
          department: delivery.createdBy.department
        } : null,
        customer: delivery.customerId ? {
          name: delivery.customerId.name,
          phone: delivery.customerId.phone,
          email: delivery.customerId.email,
          company: delivery.customerId.companyName || null
        } : null,
        driver: delivery.driverId ? {
          id: delivery.driverId._id,
          name: delivery.driverId.name,
          phone: delivery.driverId.phone,
          vehicleNumber: delivery.driverId.vehicleNumber,
          vehicleType: delivery.driverId.vehicleType,
          profileImage: delivery.driverId.profileImage || null,
          rating: delivery.driverId.rating || 0
        } : null
      },
      statusHistory
    };

    return successResponse(res, 'Delivery details retrieved successfully!', response);

  } catch (error) {
    console.error('Get Delivery Details Error:', error.message);

    if (error.name === 'CastError') {
      return errorResponse(res, 'Invalid delivery ID', 400);
    }

    return errorResponse(res, 'Failed to retrieve delivery details', 500);
  }
};

exports.listDeliveries = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.status) query.status = req.query.status;
    if (req.query.driverId) query.driverId = req.query.driverId;
    if (req.query.search) {
      query.$or = [
        { trackingNumber: { $regex: req.query.search, $options: 'i' } },
        { orderId: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const [deliveries, total, drivers] = await Promise.all([
      Delivery.find(query)
        .populate('customerId', 'name email phone')
        .populate('driverId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Delivery.countDocuments(query),
      Driver.find().populate('userId', 'name')
    ]);

    res.render('admin/deliveries/list', {
      title: 'Deliveries',
      user: req.user,
      deliveries,
      drivers,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      filters: req.query,
      success: req.query.success,
      error: req.query.error
    });
  } catch (error) {
    console.error('List Deliveries Error:', error);
    res.redirect('/admin/dashboard?error=Failed to load deliveries');
  }
};
// Render create delivery page
exports.renderCreateDelivery = async (req, res) => {
  try {
    const [customers, drivers] = await Promise.all([
      User.find({ role: 'customer' }).select('name email phone').sort({ name: 1 }),
      Driver.find({ profileStatus: 'approved' }).populate('userId', 'name phone')
    ]);

    res.render('admin/deliveries/create', {
      title: 'Create Delivery',
      user: req.user,
      customers,
      drivers
    });
  } catch (error) {
    console.error('Render Create Delivery Error:', error);
    res.redirect('/admin/deliveries?error=Failed to load create delivery page');
  }
};

// View delivery details
exports.viewDelivery = async (req, res) => {
  try {
    const delivery = await Delivery.findById(req.params.id)
      .populate('customerId', 'name email phone')
      .populate('driverId')
      .populate('createdBy', 'name email');

    if (!delivery) {
      return res.redirect('/admin/deliveries?error=Delivery not found');
    }

    const trackingLogs = await TrackingLog.find({ deliveryId: delivery._id })
      .sort({ timestamp: -1 })
      .limit(50);

    res.render('admin/deliveries/details', {
      title: `Delivery ${delivery.trackingNumber}`,
      user: req.user,
      delivery,
      trackingLogs,
      success: req.query.success,
      error: req.query.error
    });
  } catch (error) {
    console.error('View Delivery Error:', error);
    res.redirect('/admin/deliveries?error=Failed to load delivery details');
  }
};

exports.trackDelivery = async (req, res) => {
  try {
    const { trackingNumber } = req.params;

    const delivery = await Delivery.findOne({ trackingNumber })
      .populate({
        path: 'driverId',
        populate: { path: 'userId', select: 'name phone profileImage' }
      })
      .select('-createdBy -deliveryProof.otp');

    if (!delivery) {
      return errorResponse(res, 'Delivery not found', 404);
    }

    // Get status history
    const statusHistory = await DeliveryStatusHistory.find({ deliveryId: delivery._id })
      .sort({ timestamp: -1 })
      .select('-updatedBy.userId');

    return successResponse(res, 'Delivery tracking information retrieved', {
      delivery,
      statusHistory
    });

  } catch (error) {
    console.error('Track Delivery Error:', error);
    return errorResponse(res, 'Failed to track delivery', 500);
  }
};


// Get Driver Deliveries
exports.getDriverDeliveries = async (req, res) => {
  try {
    const { status } = req.query;

    const driver = req.user;

    if (!driver || driver.role !== 'driver') {
      return errorResponse(res, 'Driver profile not found or unauthorized', 404);
    }

    const query = { driverId: driver._id };
    if (status) query.status = status;

    const deliveries = await Delivery.find(query)
      .populate('customerId', 'name phone companyName')
      .populate('createdBy', 'name')
      .select('trackingNumber status priority pickupLocation deliveryLocation scheduledDeliveryTime actualDeliveryTime')
      .sort({ scheduledDeliveryTime: 1 })
      .lean();

    // Clean & beautiful response
    const formatted = deliveries.map(d => ({
      id: d._id,
      trackingNumber: d.trackingNumber,
      status: d.status,
      priority: d.priority,
      customer: d.customerId ? {
        name: d.customerId.name,
        phone: d.customerId.phone,
        company: d.customerId.companyName || null
      } : null,
      pickup: d.pickupLocation.address,
      delivery: d.deliveryLocation.address,
      scheduledTime: d.scheduledDeliveryTime,
      actualTime: d.actualDeliveryTime || null
    }));

    return successResponse(res, 'Your deliveries retrieved successfully', {
      total: formatted.length,
      deliveries: formatted
    });

  } catch (error) {
    console.error('Get Driver Deliveries Error:', error.message);
    return errorResponse(res, 'Failed to retrieve your deliveries', 500);
  }
};

//////
// Update Delivery Status
exports.updateDeliveryStatus = async (req, res) => {
  try {
    const { deliveryId } = req.params;
    const { status, remarks, location } = req.body;

    const validStatuses = ['pending', 'assigned', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'cancelled', 'failed'];
    
    if (!status || !validStatuses.includes(status)) {
      return errorResponse(res, 'Invalid status', 400);
    }

    const delivery = await Delivery.findById(deliveryId);
    if (!delivery) {
      return errorResponse(res, 'Delivery not found', 404);
    }

    // Update timestamps based on status
    if (status === 'picked_up' && !delivery.actualPickupTime) {
      delivery.actualPickupTime = new Date();
    }
    
    if (status === 'delivered' && !delivery.actualDeliveryTime) {
      delivery.actualDeliveryTime = new Date();
    }

    delivery.status = status;
    await delivery.save();

    // Create status history
    await DeliveryStatusHistory.create({
      deliveryId: delivery._id,
      status,
      location,
      remarks: remarks || `Status updated to ${status}`,
      updatedBy: {
        userId: req.user._id,
        userRole: req.user.role,
        userName: req.user.name
      }
    });

    return successResponse(res, 'Delivery status updated successfully', { delivery });

  } catch (error) {
    console.error('Update Delivery Status Error:', error);
    return errorResponse(res, error.message || 'Failed to update status', 500);
  }
};


