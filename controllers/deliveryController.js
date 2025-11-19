const Delivery = require('../models/Delivery');
const Route = require('../models/Route');
const Driver = require('../models/Driver');
const DeliveryStatusHistory = require('../models/DeliveryStatusHistory');
const Admin = require('../models/Admin');
const User = require("../models/User")
const { successResponse, errorResponse } = require('../utils/responseHelper');
const { generateOTP } = require('../utils/otpHelper');
const { sendSMS } = require('../utils/smsHelper');

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

    // 3. Fix packageDetails structure (Mongoose Object chahiye)
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

    // 5. Admin info (safe)
    const adminId = req.user?._id || null;

    // 6. Create Delivery — SAB KUCH PERFECT!
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
      trackingNumber,           // ← Auto generated
      createdBy: adminId,       // ← Safe (null bhi chalega)
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

  } catch (error) {
    console.error('Create Delivery Error:', error.message);
    return errorResponse(res, error.message || 'Failed to create delivery', 500);
  }
};

// Assign Driver to Deliver
// exports.assignDriver = async (req, res) => {
//   try {
//     const { deliveryId } = req.params;
//     const { driverId } = req.body;

//     if (!driverId) return errorResponse(res, 'Driver ID is required', 400);

//     // 1. Delivery check
//     const delivery = await Delivery.findById(deliveryId);
//     if (!delivery) return errorResponse(res, 'Delivery not found', 404);
//     if (delivery.status !== 'pending') return errorResponse(res, 'Delivery already assigned or in progress', 400);

//     // 2. Driver fetch (Tumhara Driver model standalone hai)
//     const driver = await Driver.findById(driverId);
//     if (!driver) return errorResponse(res, 'Driver not found', 404);

//     // 3. Driver ke paas hi sab kuch hai — name, phone, email already driver me hai!
//     if (!driver.isAvailable) return errorResponse(res, 'Driver is not available', 400);
//     if (driver.profileStatus !== 'approved') return errorResponse(res, 'Driver profile not approved', 400);

//     // 4. Assign Driver
//     delivery.driverId = driver._id;
//     delivery.vehicleNumber = driver.vehicleNumber;
//     delivery.status = 'assigned';
//     await delivery.save();

//     // 5. Driver ko unavailable kar do
//     driver.isAvailable = false;
//     await driver.save();

//     // 6. Status History
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

//     // 7. Success Response
//     return successResponse(res, 'Driver assigned successfully!', {
//       delivery,
//       driver: {
//         id: driver._id,
//         name: driver.name,
//         phone: driver.phone,
//         email: driver.email,
//         vehicleNumber: driver.vehicleNumber,
//         vehicleType: driver.vehicleType
//       }
//     });

//   } catch (error) {
//     console.error('Assign Driver Error:', error.message);
//     return errorResponse(res, error.message || 'Failed to assign driver', 500);
//   }
// };
exports.assignDriver = async (req, res) => {
  try {
    const { deliveryId } = req.params;
    let { driverId } = req.body;

    if (!driverId) return errorResponse(res, 'Driver ID is required', 400);

    // Extra safety: agar string galat ho to trim kar do
    driverId = driverId.trim();

    const delivery = await Delivery.findById(deliveryId);
    if (!delivery) return errorResponse(res, 'Delivery not found', 404);
    if (delivery.status !== 'pending') return errorResponse(res, 'Delivery already assigned', 400);

    const driver = await Driver.findById(driverId);
    if (!driver) {
      return errorResponse(res, `Driver not found with ID: ${driverId}`, 404);
    }

    if (!driver.isAvailable) return errorResponse(res, 'Driver is not available', 400);
    if (driver.profileStatus !== 'approved') return errorResponse(res, 'Driver profile not approved', 400);

    delivery.driverId = driver._id;
    delivery.vehicleNumber = driver.vehicleNumber;
    delivery.status = 'assigned';
    await delivery.save();

    driver.isAvailable = false;
    await driver.save();

    await DeliveryStatusHistory.create({
      deliveryId: delivery._id,
      status: 'assigned',
      remarks: `Assigned to ${driver.name} (${driver.vehicleNumber})`,
      updatedBy: {
        userId: req.user?._id || null,
        userRole: req.user?.role || 'admin',
        userName: req.user?.name || 'Admin'
      }
    });

    return successResponse(res, 'Driver assigned successfully!', {
      delivery,
      driver: {
        id: driver._id,
        name: driver.name,
        phone: driver.phone,
        vehicleNumber: driver.vehicleNumber
      }
    });

  } catch (error) {
    // Yeh error message se pata chalega kahan galti hai
    console.error('Assign Driver Error:', error.message);
    if (error.kind === 'ObjectId') {
      return errorResponse(res, `Invalid Driver ID format: ${req.body.driverId}`, 400);
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

// Get Delivery Details
// controllers/deliveryController.js → YE PURA FUNCTION REPLACE KAR DO

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

// Track Delivery by Tracking Number (Public)
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

// Get All Deliveries (Admin)
exports.getAllDeliveries = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, driverId, search } = req.query;

    const query = {};
    if (status) query.status = status;
    if (driverId) query.driverId = driverId;
    if (search) {
      query.$or = [
        { trackingNumber: { $regex: search, $options: 'i' } },
        { orderId: { $regex: search, $options: 'i' } }
      ];
    }

    const deliveries = await Delivery.find(query)
      .populate('customerId', 'name email phone')
      .populate({
        path: 'driverId',
        populate: { path: 'userId', select: 'name phone' }
      })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Delivery.countDocuments(query);

    return successResponse(res, 'Deliveries retrieved successfully', {
      deliveries,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get All Deliveries Error:', error);
    return errorResponse(res, 'Failed to retrieve deliveries', 500);
  }
};

// Get Driver Deliveries
exports.getDriverDeliveries = async (req, res) => {
  try {
    const { status } = req.query;

    const driver = await Driver.findOne({ userId: req.user._id });
    if (!driver) {
      return errorResponse(res, 'Driver profile not found', 404);
    }

    const query = { driverId: driver._id };
    if (status) query.status = status;

    const deliveries = await Delivery.find(query)
      .populate('customerId', 'name phone')
      .sort({ scheduledDeliveryTime: 1 });

    return successResponse(res, 'Deliveries retrieved successfully', { deliveries });

  } catch (error) {
    console.error('Get Driver Deliveries Error:', error);
    return errorResponse(res, 'Failed to retrieve deliveries', 500);
  }
};

// Generate OTP for Delivery
exports.generateDeliveryOTP = async (req, res) => {
  try {
    const { deliveryId } = req.params;

    const delivery = await Delivery.findById(deliveryId)
      .populate('customerId', 'phone');

    if (!delivery) {
      return errorResponse(res, 'Delivery not found', 404);
    }

    if (delivery.status !== 'out_for_delivery') {
      return errorResponse(res, 'Delivery must be out for delivery to generate OTP', 400);
    }

    // Generate 6-digit OTP
    const otp = generateOTP();

    // Save OTP
    delivery.deliveryProof.otp = otp;
    delivery.deliveryProof.otpVerified = false;
    await delivery.save();

    // Send OTP via SMS
    const message = `Your delivery OTP is: ${otp}. Tracking: ${delivery.trackingNumber}`;
    await sendSMS(delivery.deliveryLocation.contactPhone, message);

    return successResponse(res, 'OTP sent successfully');

  } catch (error) {
    console.error('Generate OTP Error:', error);
    return errorResponse(res, 'Failed to generate OTP', 500);
  }
};

// Verify OTP and Complete Delivery
exports.verifyOTPAndComplete = async (req, res) => {
  try {
    const { deliveryId } = req.params;
    const { otp, receiverName, remarks } = req.body;

    if (!otp) {
      return errorResponse(res, 'OTP is required', 400);
    }

    const delivery = await Delivery.findById(deliveryId);
    if (!delivery) {
      return errorResponse(res, 'Delivery not found', 404);
    }

    if (delivery.deliveryProof.otp !== otp) {
      return errorResponse(res, 'Invalid OTP', 401);
    }

    // Mark as delivered
    delivery.status = 'delivered';
    delivery.actualDeliveryTime = new Date();
    delivery.deliveryProof.otpVerified = true;
    delivery.deliveryProof.receiverName = receiverName;
    delivery.deliveryProof.remarks = remarks;
    await delivery.save();

    // Create status history
    await DeliveryStatusHistory.create({
      deliveryId: delivery._id,
      status: 'delivered',
      remarks: `Delivered to ${receiverName}`,
      updatedBy: {
        userId: req.user._id,
        userRole: 'driver',
        userName: req.user.name
      }
    });

    return successResponse(res, 'Delivery completed successfully', { delivery });

  } catch (error) {
    console.error('Verify OTP Error:', error);
    return errorResponse(res, 'Failed to verify OTP', 500);
  }
};