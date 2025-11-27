const Delivery = require('../models/Delivery');
const Route = require('../models/Route');
const Driver = require('../models/Driver');
const DeliveryStatusHistory = require('../models/DeliveryStatusHistory');
const { successResponse, errorResponse } = require('../utils/responseHelper');
const { generateOTP } = require('../utils/otpHelper');
const { sendSMS } = require('../utils/smsHelper');
const Remark = require('../models/Remark');

// Get Driver Deliveries
exports.getDriverDeliveries = async (req, res) => {
  try {
    const { status } = req.query;
    const driver = req.user;

    if (!driver || driver.role !== 'driver') {
      return errorResponse(res, 'Unauthorized', 401);
    }

    const query = { driverId: driver._id };
    if (status) query.status = status;

    const deliveries = await Delivery.find(query)
      .populate('customerId', 'name phone companyName')
      .populate('remarks', 'remarkText category severity color') 
      .select('trackingNumber status priority pickupLocation deliveryLocation scheduledDeliveryTime actualDeliveryTime')
      .sort({ scheduledDeliveryTime: 1 })
      .lean();

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
      actualTime: d.actualDeliveryTime || null,
      remarks: d.remarks || [] 
    }));

    return successResponse(res, 'Deliveries retrieved', { total: formatted.length, deliveries: formatted });
  } catch (error) {
    console.error('Get Driver Deliveries Error:', error);
    return errorResponse(res, 'Failed to load deliveries', 500);
  }
};

// Update Delivery Status + Attach Remark (New Way)
exports.updateDeliveryStatus = async (req, res) => {
  try {
    const { deliveryId } = req.params;
    const { status, remarkId, customRemark, location } = req.body;
    const driver = req.user;

    const validStatuses = ['picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'failed'];
    if (!validStatuses.includes(status)) {
      return errorResponse(res, 'Invalid status', 400);
    }

    const delivery = await Delivery.findOne({ _id: deliveryId, driverId: driver._id });
    if (!delivery) return errorResponse(res, 'Delivery not found or not assigned to you', 404);

    // Update timestamps
    if (status === 'picked_up' && !delivery.actualPickupTime) delivery.actualPickupTime = new Date();
    if (status === 'delivered' && !delivery.actualDeliveryTime) delivery.actualDeliveryTime = new Date();

    delivery.status = status;
    
    let usedRemark = null;

    // Handle Remark (Predefined or Custom)
    if (remarkId) {
      usedRemark = await Remark.findOne({ _id: remarkId, isActive: true });
      if (!usedRemark) return errorResponse(res, 'Remark not found', 404);
    } else if (customRemark) {
      usedRemark = await Remark.create({
        remarkType: 'custom',
        remarkText: customRemark,
        category: 'other',
        createdBy: driver._id,
        isPredefined: false,
        requiresApproval: true,
        approvalStatus: 'pending'
      });
    }

    // Attach remark to delivery
    if (usedRemark) {
      await usedRemark.addDeliveryAssociation(delivery._id); 
      if (!delivery.remarks.includes(usedRemark._id)) {
        delivery.remarks.push(usedRemark._id);
      }
    }

    await delivery.save();

    // Status History with Remark
    await DeliveryStatusHistory.create({
      deliveryId: delivery._id,
      status,
      location,
      remarks: usedRemark ? `Remark: ${usedRemark.remarkText}` : `Status updated to ${status}`,
      remarkId: usedRemark?._id || null,
      updatedBy: { userId: driver._id, userRole: 'driver', userName: driver.name }
    });

    return successResponse(res, 'Status updated successfully', {
      delivery: { id: delivery._id, status: delivery.status, remarks: delivery.remarks }
    });

  } catch (error) {
    console.error('Update Status Error:', error);
    return errorResponse(res, 'Failed to update status', 500);
  }
};

// // Accept Delivery
// exports.acceptDelivery = async (req, res) => {
//   try {
//     const { deliveryId } = req.params;
//     const driver = req.user;
 
//     const delivery = await Delivery.findOne({
//       _id: deliveryId,
//       driverId: driver._id,
//       status: 'pending_acceptance'
//     });

//     if (!delivery) return errorResponse(res, 'Not pending acceptance', 400);

//     // delivery.status = 'assigned';
//     delivery.status = 'pending_acceptance';   
//     await delivery.save();

//     // Auto add "Accepted" remark
//     const acceptRemark = await Remark.create({
//       remarkType: 'predefined',
//       remarkText: 'Delivery accepted by driver',
//       category: 'delivery_status',
//       severity: 'low',
//       isPredefined: true,
//       createdBy: driver._id
//     });

//     await acceptRemark.addDeliveryAssociation(delivery._id);
//     delivery.remarks.push(acceptRemark._id);
//     await delivery.save();

//     await DeliveryStatusHistory.create({
//       deliveryId: delivery._id,
//       status: 'assigned',
//       remarks: 'Driver accepted the delivery',
//       remarkId: acceptRemark._id,
//       updatedBy: { userId: driver._id, userRole: 'driver', userName: driver.name }
//     });

//     return successResponse(res, 'Delivery accepted!', { status: 'assigned' });
//   } catch (error) {
//     console.error('Accept Error:', error);
//     return errorResponse(res, 'Failed to accept', 500);
//   }
// };

exports.acceptDelivery = async (req, res) => {
  try {
    const { deliveryId } = req.params;
    const driver = req.user;

    const delivery = await Delivery.findOne({
      _id: deliveryId,
      driverId: driver._id,
      status: 'pending_acceptance' 
    });

    if (!delivery) {
      return errorResponse(res, 'Delivery not found or not in pending acceptance state', 400);
    }
 
    delivery.status = 'assigned';   
   
    await delivery.save();

    const acceptRemark = await Remark.create({
      remarkType: 'predefined',
      remarkText: 'Delivery accepted by driver',
      category: 'delivery_status',
      severity: 'low',
      isPredefined: true,
      createdBy: driver._id
    });

    await acceptRemark.addDeliveryAssociation(delivery._id);
    delivery.remarks.push(acceptRemark._id);
    await delivery.save();

    await DeliveryStatusHistory.create({
      deliveryId: delivery._id,
      status: 'assigned',
      remarks: 'Driver accepted the delivery',
      remarkId: acceptRemark._id,
      updatedBy: {
        userId: driver._id,
        userRole: 'driver',
        userName: driver.name
      }
    });

    return successResponse(res, 'Delivery accepted successfully!', {
      deliveryId: delivery._id,
      trackingNumber: delivery.trackingNumber,
      status: 'assigned'
    });

  } catch (error) {
    console.error('Accept Delivery Error:', error);
    return errorResponse(res, 'Failed to accept delivery', 500);
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


/////////////////////////////////////
// // Get Driver Deliveries
// exports.getDriverDeliveries = async (req, res) => {
//   try {
//     const { status } = req.query;

//     const driver = req.user;

//     if (!driver || driver.role !== 'driver') {
//       return errorResponse(res, 'Driver profile not found or unauthorized', 404);
//     }

//     const query = { driverId: driver._id };
//     if (status) query.status = status;

//     const deliveries = await Delivery.find(query)
//       .populate('customerId', 'name phone companyName')
//       .populate('createdBy', 'name')
//       .select('trackingNumber status priority pickupLocation deliveryLocation scheduledDeliveryTime actualDeliveryTime')
//       .sort({ scheduledDeliveryTime: 1 })
//       .lean();

//     // Clean & beautiful response
//     const formatted = deliveries.map(d => ({
//       id: d._id,
//       trackingNumber: d.trackingNumber,
//       status: d.status,
//       priority: d.priority,
//       customer: d.customerId ? {
//         name: d.customerId.name,
//         phone: d.customerId.phone,
//         company: d.customerId.companyName || null
//       } : null,
//       pickup: d.pickupLocation.address,
//       delivery: d.deliveryLocation.address,
//       scheduledTime: d.scheduledDeliveryTime,
//       actualTime: d.actualDeliveryTime || null
//     }));

//     return successResponse(res, 'Your deliveries retrieved successfully', {
//       total: formatted.length,
//       deliveries: formatted
//     });

//   } catch (error) {
//     console.error('Get Driver Deliveries Error:', error.message);
//     return errorResponse(res, 'Failed to retrieve your deliveries', 500);
//   }
// };

// // Update Delivery Status
// exports.updateDeliveryStatus = async (req, res) => {
//   try {
//     const { deliveryId } = req.params;
//     const { status, remarks, location } = req.body;

//     const validStatuses = ['pending', 'assigned', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'cancelled', 'failed'];
    
//     if (!status || !validStatuses.includes(status)) {
//       return errorResponse(res, 'Invalid status', 400);
//     }

//     const delivery = await Delivery.findById(deliveryId);
//     if (!delivery) {
//       return errorResponse(res, 'Delivery not found', 404);
//     }

//     // Update timestamps based on status
//     if (status === 'picked_up' && !delivery.actualPickupTime) {
//       delivery.actualPickupTime = new Date();
//     }
    
//     if (status === 'delivered' && !delivery.actualDeliveryTime) {
//       delivery.actualDeliveryTime = new Date();
//     }

//     delivery.status = status;
//     await delivery.save();

//     // Create status history
//     await DeliveryStatusHistory.create({
//       deliveryId: delivery._id,
//       status,
//       location,
//       remarks: remarks || `Status updated to ${status}`,
//       updatedBy: {
//         userId: req.user._id,
//         userRole: req.user.role,
//         userName: req.user.name
//       }
//     });

//     return successResponse(res, 'Delivery status updated successfully', { delivery });

//   } catch (error) {
//     console.error('Update Delivery Status Error:', error);
//     return errorResponse(res, error.message || 'Failed to update status', 500);
//   }
// };

// // Generate OTP for Delivery
// exports.generateDeliveryOTP = async (req, res) => {
//   try {
//     const { deliveryId } = req.params;

//     const delivery = await Delivery.findById(deliveryId)
//       .populate('customerId', 'phone');

//     if (!delivery) {
//       return errorResponse(res, 'Delivery not found', 404);
//     }

//     if (delivery.status !== 'out_for_delivery') {
//       return errorResponse(res, 'Delivery must be out for delivery to generate OTP', 400);
//     }

//     // Generate 6-digit OTP
//     const otp = generateOTP();

//     // Save OTP
//     delivery.deliveryProof.otp = otp;
//     delivery.deliveryProof.otpVerified = false;
//     await delivery.save();

//     // Send OTP via SMS
//     const message = `Your delivery OTP is: ${otp}. Tracking: ${delivery.trackingNumber}`;
//     await sendSMS(delivery.deliveryLocation.contactPhone, message);

//     return successResponse(res, 'OTP sent successfully');

//   } catch (error) {
//     console.error('Generate OTP Error:', error);
//     return errorResponse(res, 'Failed to generate OTP', 500);
//   }
// };

// // Verify OTP and Complete Delivery
// exports.verifyOTPAndComplete = async (req, res) => {
//   try {
//     const { deliveryId } = req.params;
//     const { otp, receiverName, remarks } = req.body;

//     if (!otp) {
//       return errorResponse(res, 'OTP is required', 400);
//     }

//     const delivery = await Delivery.findById(deliveryId);
//     if (!delivery) {
//       return errorResponse(res, 'Delivery not found', 404);
//     }

//     if (delivery.deliveryProof.otp !== otp) {
//       return errorResponse(res, 'Invalid OTP', 401);
//     }

//     // Mark as delivered
//     delivery.status = 'delivered';
//     delivery.actualDeliveryTime = new Date();
//     delivery.deliveryProof.otpVerified = true;
//     delivery.deliveryProof.receiverName = receiverName;
//     delivery.deliveryProof.remarks = remarks;
//     await delivery.save();

//     // Create status history
//     await DeliveryStatusHistory.create({
//       deliveryId: delivery._id,
//       status: 'delivered',
//       remarks: `Delivered to ${receiverName}`,
//       updatedBy: {
//         userId: req.user._id,
//         userRole: 'driver',
//         userName: req.user.name
//       }
//     });

//     return successResponse(res, 'Delivery completed successfully', { delivery });

//   } catch (error) {
//     console.error('Verify OTP Error:', error);
//     return errorResponse(res, 'Failed to verify OTP', 500);
//   }
// };

// // DRIVER ACCEPTS THE DELIVERY
// exports.acceptDelivery = async (req, res) => {
//   try {
//     const { deliveryId } = req.params;
//     const driver = req.user; 

//     const delivery = await Delivery.findOne({
//       _id: deliveryId,
//       driverId: driver._id,
//       status: 'pending_acceptance'
//     });

//     if (!delivery) {
//       return errorResponse(res, 'Delivery not found or not pending acceptance', 404);
//     }

//     delivery.status = 'assigned';
//     await delivery.save();

//     await DeliveryStatusHistory.create({
//       deliveryId: delivery._id,
//       status: 'assigned',
//       remarks: `Driver ${driver.name} accepted the delivery`,
//       updatedBy: {
//         userId: driver._id,
//         userRole: 'driver',
//         userName: driver.name
//       }
//     });

//     return successResponse(res, 'Delivery accepted successfully!', {
//       deliveryId: delivery._id,
//       trackingNumber: delivery.trackingNumber,
//       status: 'assigned'
//     });

//   } catch (error) {
//     console.error('Accept Delivery Error:', error);
//     return errorResponse(res, 'Failed to accept delivery', 500);
//   }
// };

// // DRIVER REJECTS THE DELIVERY
// exports.rejectDelivery = async (req, res) => {
//   try {
//     const { deliveryId } = req.params;
//     const { reason } = req.body;
//     const driver = req.user;

//     const delivery = await Delivery.findOne({
//       _id: deliveryId,
//       driverId: driver._id,
//       status: 'pending_acceptance'
//     });

//     if (!delivery) {
//       return errorResponse(res, 'Delivery not found or not pending acceptance', 404);
//     }

//     // Revert driver availability
//     await Driver.findByIdAndUpdate(driver._id, { isAvailable: true });

//     delivery.driverId = null;
//     delivery.vehicleNumber = null;
//     delivery.status = 'pending'; 
//     await delivery.save();

//     await DeliveryStatusHistory.create({
//       deliveryId: delivery._id,
//       status: 'pending',
//       remarks: `Driver ${driver.name} rejected delivery. Reason: ${reason || 'No reason given'}`,
//       updatedBy: {
//         userId: driver._id,
//         userRole: 'driver',
//         userName: driver.name
//       }
//     });

//     return successResponse(res, 'Delivery rejected. Admin will reassign.', {
//       deliveryId: delivery._id,
//       trackingNumber: delivery.trackingNumber,
//       status: 'pending'
//     });

//   } catch (error) {
//     console.error('Reject Delivery Error:', error);
//     return errorResponse(res, 'Failed to reject delivery', 500);
//   }
// };
