const Delivery = require('../../models/Delivery');
const Order = require('../../models/Order');
const Driver = require('../../models/Driver');
const Customer = require('../../models/Customer');
const DeliveryStatusHistory = require('../../models/DeliveryStatusHistory');
const Notification = require('../../models/Notification');
const mongoose = require('mongoose');
const { successResponse, errorResponse } = require('../../utils/responseHelper');

// ============= RENDER CREATE DELIVERY FROM ORDER =============
exports.renderCreateDeliveryFromOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      req.flash('error', 'Invalid order ID');
      return res.redirect('/admin/orders');
    }

    // Get order details
    const order = await Order.findById(orderId)
      .populate({
        path: 'customerId',
        model: 'Customer',
        select: 'name email phone companyName customerId'
      })
      .lean();

    if (!order) {
      req.flash('error', 'Order not found');
      return res.redirect('/admin/orders');
    }

    // Check if delivery already exists
    const existingDelivery = await Delivery.findOne({ orderId: order.orderNumber });
    if (existingDelivery) {
      req.flash('error', 'Delivery already exists for this order');
      return res.redirect(`/admin/deliveries/${existingDelivery._id}`);
    }

    // Get available drivers
    const drivers = await Driver.find({
      isActive: true,
      isAvailable: true,
      profileStatus: 'approved'
    })
      .select('name phone vehicleNumber profileImage isAvailable')
      .lean();

    res.render('delivery_create', {
      title: `Create Delivery - ${order.orderNumber}`,
      user: req.user,
      order,
      drivers,
      url: req.originalUrl,
      messages: req.flash()
    });

  } catch (error) {
    console.error('[RENDER-CREATE-DELIVERY] Error:', error);
    req.flash('error', 'Failed to load create delivery page');
    res.redirect('/admin/orders');
  }
};

// ============= CREATE DELIVERY FROM ORDER =============
exports.createDeliveryFromOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const {
      customerId,
      driverId,
      scheduledPickupTime,
      scheduledDeliveryTime,
      instructions,
      waypoints,
      routeDistance,
      routeDuration
    } = req.body;

    console.log('[CREATE-DELIVERY] Order ID:', orderId);

    // Get order
    const order = await Order.findById(orderId)
      .populate({
        path: 'customerId',
        model: 'Customer'
      });

    if (!order) {
      req.flash('error', 'Order not found');
      return res.redirect('/admin/orders');
    }

    // Check if delivery exists
    const existing = await Delivery.findOne({ orderId: order.orderNumber });
    if (existing) {
      req.flash('error', 'Delivery already exists for this order');
      return res.redirect(`/admin/deliveries/${existing._id}`);
    }

    // Validate driver
    const driver = await Driver.findById(driverId);
    if (!driver) {
      req.flash('error', 'Driver not found');
      return res.redirect(`/admin/orders/${orderId}/create-delivery`);
    }

    if (!driver.isAvailable || driver.profileStatus !== 'approved') {
      req.flash('error', 'Driver is not available or not approved');
      return res.redirect(`/admin/orders/${orderId}/create-delivery`);
    }

    // Generate tracking number
    const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const random = Math.floor(1000 + Math.random() * 9000);
    const trackingNumber = `DEL${dateStr}${random}`;

    // Parse waypoints
    let parsedWaypoints = [];
    if (waypoints) {
      try {
        parsedWaypoints = JSON.parse(waypoints);
      } catch (e) {
        console.error('Waypoints parse error:', e);
      }
    }

    // Create delivery
    const delivery = await Delivery.create({
      trackingNumber,
      orderId: order.orderNumber,
      customerId: order.customerId._id,
      driverId,
      vehicleNumber: driver.vehicleNumber,
      pickupLocation: order.pickupLocation,
      deliveryLocation: order.deliveryLocation,
      packageDetails: {
        description: order.items.map(i => i.productName).join(', '),
        quantity: order.items.reduce((sum, i) => sum + i.quantity, 0),
        weight: order.items.reduce((sum, i) => sum + (i.specifications?.weight || 0), 0)
      },
      scheduledPickupTime: scheduledPickupTime ? new Date(scheduledPickupTime) : null,
      scheduledDeliveryTime: scheduledDeliveryTime ? new Date(scheduledDeliveryTime) : null,
      instructions,
      waypoints: parsedWaypoints,
      distance: parseFloat(routeDistance) || 0,
      estimatedDuration: parseInt(routeDuration) || 0,
      status: 'assigned',
      priority: order.priority,
      createdBy: req.user._id
    });

    // Update order with delivery reference
    order.deliveryId = delivery._id;
    order.status = 'assigned';
    await order.save();

    // Mark driver as unavailable
    driver.isAvailable = false;
    await driver.save();

    // Create status history
    await DeliveryStatusHistory.create({
      deliveryId: delivery._id,
      status: 'assigned',
      remarks: `Delivery assigned to ${driver.name} (${driver.vehicleNumber})`,
      updatedBy: {
        userId: req.user._id,
        userRole: req.user.role,
        userName: req.user.name
      }
    });

    // Send notification to driver
    if (driver.userId) {
      await Notification.create({
        userId: driver.userId,
        type: 'delivery_assigned',
        title: 'New Delivery Assigned',
        message: `You have been assigned delivery ${trackingNumber}. Check details in your app.`,
        referenceId: delivery._id,
        referenceModel: 'Delivery',
        priority: 'high'
      });
    }

    console.log('[CREATE-DELIVERY] Success:', trackingNumber);
    req.flash('success', 'Delivery created and driver assigned successfully!');
    res.redirect(`/admin/deliveries/${delivery._id}`);

  } catch (error) {
    console.error('[CREATE-DELIVERY] Error:', error);
    req.flash('error', error.message || 'Failed to create delivery');
    res.redirect(`/admin/orders/${req.params.orderId}/create-delivery`);
  }
};

// ============= RENDER DELIVERIES LIST =============
exports.renderDeliveriesList = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      search,
      startDate,
      endDate
    } = req.query;

    const query = {};
    if (status) query.status = status;
    
    if (search) {
      query.$or = [
        { trackingNumber: { $regex: search, $options: 'i' } },
        { orderId: { $regex: search, $options: 'i' } }
      ];
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const deliveries = await Delivery.find(query)
      .populate({
        path: 'customerId',
        model: 'Customer',
        select: 'name email phone companyName customerId'
      })
      .populate('driverId', 'name phone vehicleNumber')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Delivery.countDocuments(query);

    // Statistics
    const stats = await Delivery.aggregate([
      {
        $facet: {
          total: [{ $count: 'count' }],
          delivered: [{ $match: { status: 'delivered' } }, { $count: 'count' }],
          inTransit: [
            { $match: { status: { $in: ['in_transit', 'assigned', 'picked_up', 'out_for_delivery'] } } },
            { $count: 'count' }
          ],
          pending: [{ $match: { status: { $in: ['pending', 'pending_acceptance'] } } }, { $count: 'count' }]
        }
      }
    ]);

    const statistics = {
      total: stats[0].total[0]?.count || 0,
      delivered: stats[0].delivered[0]?.count || 0,
      inTransit: stats[0].inTransit[0]?.count || 0,
      pending: stats[0].pending[0]?.count || 0
    };

    res.render('deliveries_list', { 
      title: 'Deliveries Management',
      user: req.user,
      deliveries,
      stats: statistics,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit)
      },
      filters: { status, search, startDate, endDate },
      url: req.originalUrl,
      messages: req.flash()
    });

  } catch (error) {
    console.error('[DELIVERIES-LIST] Error:', error);
    req.flash('error', 'Failed to load deliveries');
    res.redirect('/admin/dashboard');
  }
};

// ============= RENDER DELIVERY DETAILS =============
exports.renderDeliveryDetails = async (req, res) => {
  try {
    const { deliveryId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(deliveryId)) {
      req.flash('error', 'Invalid delivery ID');
      return res.redirect('/admin/deliveries');
    }

    const delivery = await Delivery.findById(deliveryId)
      .populate({
        path: 'customerId',
        model: 'Customer',
        select: 'name email phone companyName customerId'
      })
      .populate('driverId', 'name phone vehicleNumber profileImage')
      .populate('createdBy', 'name email')
      .lean();

    if (!delivery) {
      req.flash('error', 'Delivery not found');
      return res.redirect('/admin/deliveries');
    }

    // Get status history
    const statusHistory = await DeliveryStatusHistory.find({ deliveryId: delivery._id })
      .sort({ timestamp: -1 })
      .populate('updatedBy.userId', 'name email')
      .lean();

    res.render('delivery_details', {
      title: `Delivery ${delivery.trackingNumber}`,
      user: req.user,
      delivery,
      statusHistory,
      url: req.originalUrl,
      messages: req.flash()
    });

  } catch (error) {
    console.error('[DELIVERY-DETAILS] Error:', error);
    req.flash('error', 'Failed to load delivery details');
    res.redirect('/admin/deliveries');
  }
};

// ============= GET LIVE DRIVER LOCATION (API) =============
exports.getDriverLiveLocation = async (req, res) => {
  try {
    const { deliveryId } = req.params;

    const delivery = await Delivery.findById(deliveryId)
      .populate('driverId', 'currentLocation')
      .lean();

    if (!delivery || !delivery.driverId) {
      return errorResponse(res, 'Delivery or driver not found', 404);
    }

    // Get driver's current location (assuming it's stored in Driver model)
    const location = delivery.driverId.currentLocation || {
      latitude: delivery.pickupLocation.coordinates.latitude,
      longitude: delivery.pickupLocation.coordinates.longitude,
      speed: 0,
      timestamp: new Date()
    };

    return successResponse(res, 'Location retrieved', { location });

  } catch (error) {
    console.error('[LIVE-LOCATION] Error:', error);
    return errorResponse(res, 'Failed to get location', 500);
  }
};

// ============= UPDATE DELIVERY STATUS =============
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

    const previousStatus = delivery.status;

    // Update timestamps
    if (status === 'picked_up' && !delivery.actualPickupTime) {
      delivery.actualPickupTime = new Date();
    }
    
    if (status === 'delivered' && !delivery.actualDeliveryTime) {
      delivery.actualDeliveryTime = new Date();
      
      // Make driver available again
      if (delivery.driverId) {
        await Driver.findByIdAndUpdate(delivery.driverId, { isAvailable: true });
      }
    }

    delivery.status = status;
    await delivery.save();

    // Create status history
    await DeliveryStatusHistory.create({
      deliveryId: delivery._id,
      status,
      previousStatus,
      location,
      remarks: remarks || `Status updated to ${status}`,
      updatedBy: {
        userId: req.user._id,
        userRole: req.user.role,
        userName: req.user.name
      }
    });

    // Update linked order status
    if (delivery.orderId) {
      const orderStatusMap = {
        'picked_up': 'in_transit',
        'in_transit': 'in_transit',
        'out_for_delivery': 'in_transit',
        'delivered': 'delivered',
        'cancelled': 'cancelled'
      };

      if (orderStatusMap[status]) {
        await Order.updateOne(
          { orderNumber: delivery.orderId },
          { status: orderStatusMap[status] }
        );
      }
    }

    return successResponse(res, 'Status updated successfully', { delivery });

  } catch (error) {
    console.error('[UPDATE-STATUS] Error:', error);
    return errorResponse(res, 'Failed to update status', 500);
  }
};

// ============= COMPLETE WAYPOINT =============
exports.completeWaypoint = async (req, res) => {
  try {
    const { deliveryId, waypointIndex } = req.params;
    const { remarks, photo } = req.body;

    const delivery = await Delivery.findById(deliveryId);
    if (!delivery) {
      return errorResponse(res, 'Delivery not found', 404);
    }

    if (!delivery.waypoints || !delivery.waypoints[waypointIndex]) {
      return errorResponse(res, 'Waypoint not found', 404);
    }

    delivery.waypoints[waypointIndex].completed = true;
    delivery.waypoints[waypointIndex].completedAt = new Date();
    delivery.waypoints[waypointIndex].remarks = remarks;
    if (photo) delivery.waypoints[waypointIndex].photo = photo;

    await delivery.save();

    return successResponse(res, 'Waypoint marked as completed', { waypoint: delivery.waypoints[waypointIndex] });

  } catch (error) {
    console.error('[COMPLETE-WAYPOINT] Error:', error);
    return errorResponse(res, 'Failed to complete waypoint', 500);
  }
};

// ============= SUBMIT DELIVERY PROOF =============
exports.submitDeliveryProof = async (req, res) => {
  try {
    const { deliveryId } = req.params;
    const { signature, photos, receiverName, otp } = req.body;

    const delivery = await Delivery.findById(deliveryId);
    if (!delivery) {
      return errorResponse(res, 'Delivery not found', 404);
    }

    if (delivery.status !== 'out_for_delivery') {
      return errorResponse(res, 'Delivery must be out for delivery to submit proof', 400);
    }

    // Verify OTP if provided
    let otpVerified = false;
    if (otp && delivery.deliveryProof?.otp) {
      otpVerified = (otp === delivery.deliveryProof.otp);
    }

    delivery.deliveryProof = {
      signature,
      photos: photos || [],
      receiverName,
      otpVerified
    };

    delivery.status = 'delivered';
    delivery.actualDeliveryTime = new Date();

    await delivery.save();

    // Make driver available
    if (delivery.driverId) {
      await Driver.findByIdAndUpdate(delivery.driverId, { isAvailable: true });
    }

    // Update order
    if (delivery.orderId) {
      await Order.updateOne(
        { orderNumber: delivery.orderId },
        { status: 'delivered' }
      );
    }

    // Create status history
    await DeliveryStatusHistory.create({
      deliveryId: delivery._id,
      status: 'delivered',
      previousStatus: 'out_for_delivery',
      remarks: `Delivered to ${receiverName}. OTP ${otpVerified ? 'verified' : 'not verified'}.`,
      updatedBy: {
        userId: req.user._id,
        userRole: req.user.role,
        userName: req.user.name
      }
    });

    return successResponse(res, 'Delivery completed successfully!', { delivery });

  } catch (error) {
    console.error('[SUBMIT-PROOF] Error:', error);
    return errorResponse(res, 'Failed to submit delivery proof', 500);
  }
};

// ============= ADD DELIVERY REMARK =============
exports.addDeliveryRemark = async (req, res) => {
  try {
    const { deliveryId } = req.params;
    const { message, images } = req.body;

    const delivery = await Delivery.findById(deliveryId);
    if (!delivery) {
      return errorResponse(res, 'Delivery not found', 404);
    }

    const remark = {
      message,
      images: images || [],
      createdBy: req.user._id,
      createdAt: new Date()
    };

    if (!delivery.remarks) delivery.remarks = [];
    delivery.remarks.push(remark);

    await delivery.save();

    return successResponse(res, 'Remark added successfully', { remark });

  } catch (error) {
    console.error('[ADD-REMARK] Error:', error);
    return errorResponse(res, 'Failed to add remark', 500);
  }
};

module.exports = exports;