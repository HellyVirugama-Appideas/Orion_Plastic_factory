// const Delivery = require('../../models/Delivery');
// const Order = require('../../models/Order');
// const Driver = require('../../models/Driver');
// const Customer = require('../../models/Customer');
// const DeliveryStatusHistory = require('../../models/DeliveryStatusHistory');
// const Notification = require('../../models/Notification');
// const mongoose = require('mongoose');
// const { successResponse, errorResponse } = require('../../utils/responseHelper');

// // ============= RENDER CREATE DELIVERY FROM ORDER =============
// exports.renderCreateDeliveryFromOrder = async (req, res) => {
//   try {
//     const { orderId } = req.params;

//     if (!mongoose.Types.ObjectId.isValid(orderId)) {
//       req.flash('error', 'Invalid order ID');
//       return res.redirect('/admin/orders');
//     }

//     // Get order details
//     const order = await Order.findById(orderId)
//       .populate({
//         path: 'customerId',
//         model: 'Customer',
//         select: 'name email phone companyName customerId'
//       })
//       .lean();

//     if (!order) {
//       req.flash('error', 'Order not found');
//       return res.redirect('/admin/orders');
//     }

//     // Check if delivery already exists
//     const existingDelivery = await Delivery.findOne({ orderId: order.orderNumber });
//     if (existingDelivery) {
//       req.flash('error', 'Delivery already exists for this order');
//       return res.redirect(`/admin/deliveries/${existingDelivery._id}`);
//     }

//     // ✅ FIX: Ensure coordinates exist, provide defaults if missing
//     if (!order.pickupLocation.coordinates) {
//       order.pickupLocation.coordinates = {
//         latitude: 23.0225,  // Default Ahmedabad coordinates
//         longitude: 72.5714
//       };
//     }

//     if (!order.deliveryLocation.coordinates) {
//       order.deliveryLocation.coordinates = {
//         latitude: 23.0225,  // Default Ahmedabad coordinates
//         longitude: 72.5714
//       };
//     }

//     console.log('[CREATE-DELIVERY] Order:', order.orderNumber);
//     console.log('[CREATE-DELIVERY] Pickup coords:', order.pickupLocation.coordinates);
//     console.log('[CREATE-DELIVERY] Delivery coords:', order.deliveryLocation.coordinates);

//     // Get available drivers
//     const drivers = await Driver.find({
//       isActive: true,
//       isAvailable: true,
//       profileStatus: 'approved'
//     })
//       .select('name phone vehicleNumber profileImage isAvailable')
//       .lean();

//     res.render('delivery_create', {
//       title: `Create Delivery - ${order.orderNumber}`,
//       user: req.user,
//       order,
//       drivers,
//       url: req.originalUrl,
//       messages: req.flash()
//     });

//   } catch (error) {
//     console.error('[RENDER-CREATE-DELIVERY] Error:', error);
//     req.flash('error', 'Failed to load create delivery page');
//     res.redirect('/admin/orders');
//   }
// };


// // ============= CREATE DELIVERY FROM ORDER =============
// // exports.createDeliveryFromOrder = async (req, res) => {
// //   try {
// //     const { orderId } = req.params;
// //     const {
// //       customerId,
// //       driverId,
// //       scheduledPickupTime,
// //       scheduledDeliveryTime,
// //       instructions,
// //       waypoints,
// //       routeDistance,
// //       routeDuration
// //     } = req.body;

// //     console.log('[CREATE-DELIVERY] Order ID:', orderId);

// //     // Get order
// //     const order = await Order.findById(orderId)
// //       .populate({
// //         path: 'customerId',
// //         model: 'Customer'
// //       });

// //     if (!order) {
// //       req.flash('error', 'Order not found');
// //       return res.redirect('/admin/orders');
// //     }

// //     // Check if delivery exists
// //     const existing = await Delivery.findOne({ orderId: order.orderNumber });
// //     if (existing) {
// //       req.flash('error', 'Delivery already exists for this order');
// //       return res.redirect(`/admin/deliveries/${existing._id}`);
// //     }

// //     // Validate driver
// //     const driver = await Driver.findById(driverId);
// //     if (!driver) {
// //       req.flash('error', 'Driver not found');
// //       return res.redirect(`/admin/orders/${orderId}/create-delivery`);
// //     }

// //     if (!driver.isAvailable || driver.profileStatus !== 'approved') {
// //       req.flash('error', 'Driver is not available or not approved');
// //       return res.redirect(`/admin/orders/${orderId}/create-delivery`);
// //     }

// //     // Generate tracking number
// //     const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
// //     const random = Math.floor(1000 + Math.random() * 9000);
// //     const trackingNumber = `DEL${dateStr}${random}`;

// //     // Parse waypoints
// //     let parsedWaypoints = [];
// //     if (waypoints) {
// //       try {
// //         parsedWaypoints = JSON.parse(waypoints);
// //       } catch (e) {
// //         console.error('Waypoints parse error:', e);
// //       }
// //     }

// //     // Create delivery
// //     const delivery = await Delivery.create({
// //       trackingNumber,
// //       orderId: order.orderNumber,
// //       customerId: order.customerId._id,
// //       driverId,
// //       vehicleNumber: driver.vehicleNumber,
// //       pickupLocation: order.pickupLocation,
// //       deliveryLocation: order.deliveryLocation,
// //       packageDetails: {
// //         description: order.items.map(i => i.productName).join(', '),
// //         quantity: order.items.reduce((sum, i) => sum + i.quantity, 0),
// //         weight: order.items.reduce((sum, i) => sum + (i.specifications?.weight || 0), 0)
// //       },
// //       scheduledPickupTime: scheduledPickupTime ? new Date(scheduledPickupTime) : null,
// //       scheduledDeliveryTime: scheduledDeliveryTime ? new Date(scheduledDeliveryTime) : null,
// //       instructions,
// //       waypoints: parsedWaypoints,
// //       distance: parseFloat(routeDistance) || 0,
// //       estimatedDuration: parseInt(routeDuration) || 0,
// //       status: 'assigned',
// //       priority: order.priority,
// //       createdBy: req.user._id
// //     });

// //     // Update order with delivery reference
// //     order.deliveryId = delivery._id;
// //     order.status = 'assigned';
// //     await order.save();

// //     // Mark driver as unavailable
// //     driver.isAvailable = false;
// //     await driver.save();

// //     // Create status history
// //     await DeliveryStatusHistory.create({
// //       deliveryId: delivery._id,
// //       status: 'assigned',
// //       remarks: `Delivery assigned to ${driver.name} (${driver.vehicleNumber})`,
// //       updatedBy: {
// //         userId: req.user._id,
// //         userRole: req.user.role,
// //         userName: req.user.name
// //       }
// //     });

// //     // Send notification to driver
// //     if (driver.userId) {
// //       await Notification.create({
// //         userId: driver.userId,
// //         type: 'delivery_assigned',
// //         title: 'New Delivery Assigned',
// //         message: `You have been assigned delivery ${trackingNumber}. Check details in your app.`,
// //         referenceId: delivery._id,
// //         referenceModel: 'Delivery',
// //         priority: 'high'
// //       });
// //     }

// //     console.log('[CREATE-DELIVERY] Success:', trackingNumber);
// //     req.flash('success', 'Delivery created and driver assigned successfully!');
// //     res.redirect(`/admin/deliveries/${delivery._id}`);

// //   } catch (error) {
// //     console.error('[CREATE-DELIVERY] Error:', error);
// //     req.flash('error', error.message || 'Failed to create delivery');
// //     res.redirect(`/admin/orders/${req.params.orderId}/create-delivery`);
// //   }
// // };

// exports.createDeliveryFromOrder = async (req, res) => {
//   try {
//     const { orderId } = req.params;
//     const {
//       customerId,
//       driverId,
//       scheduledPickupTime,
//       scheduledDeliveryTime,
//       instructions,
//       waypoints,
//       routeDistance,
//       routeDuration
//     } = req.body;

//     console.log('[CREATE-DELIVERY] Order ID:', orderId);

//     // Get order
//     const order = await Order.findById(orderId)
//       .populate({
//         path: 'customerId',
//         model: 'Customer'
//       });

//     if (!order) {
//       req.flash('error', 'Order not found');
//       return res.redirect('/admin/orders');
//     }

//     // Check if delivery exists
//     const existing = await Delivery.findOne({ orderId: order.orderNumber });
//     if (existing) {
//       req.flash('error', 'Delivery already exists for this order');
//       return res.redirect(`/admin/deliveries/${existing._id}`);
//     }

//     // Validate driver
//     const driver = await Driver.findById(driverId);
//     if (!driver) {
//       req.flash('error', 'Driver not found');
//       return res.redirect(`/admin/orders/${orderId}/create-delivery`);
//     }

//     if (driver.isAvailable === false  || driver.profileStatus !== 'approved') {
//       req.flash('error', 'Driver is not available or not approved');
//       return res.redirect(`/admin/orders/${orderId}/create-delivery`);
//     }

//     // Generate tracking number
//     const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
//     const random = Math.floor(1000 + Math.random() * 9000);
//     const trackingNumber = `DEL${dateStr}${random}`;

//     // Parse waypoints
//     let parsedWaypoints = [];
//     if (waypoints) {
//       try {
//         parsedWaypoints = JSON.parse(waypoints);
//       } catch (e) {
//         console.error('Waypoints parse error:', e);
//       }
//     }

//     // SAFE: Extract coordinates with fallback (Delhi center)
//     const defaultLat = 28.7041;
//     const defaultLng = 77.1025;

//     const pickupCoords = {
//       latitude: order?.pickupLocation?.coordinates?.latitude ?? defaultLat,
//       longitude: order?.pickupLocation?.coordinates?.longitude ?? defaultLng
//     };

//     const deliveryCoords = {
//       latitude: order?.deliveryLocation?.coordinates?.latitude ?? defaultLat,
//       longitude: order?.deliveryLocation?.coordinates?.longitude ?? defaultLng
//     };

//     // Create delivery
//     const delivery = await Delivery.create({
//       trackingNumber,
//       orderId: order.orderNumber,
//       customerId: order.customerId?._id || null, // Safe: null if missing
//       driverId,
//       vehicleNumber: driver.vehicleNumber,
//       pickupLocation: {
//         ...order.pickupLocation,
//         coordinates: pickupCoords // Safe coords
//       },
//       deliveryLocation: {
//         ...order.deliveryLocation,
//         coordinates: deliveryCoords // Safe coords
//       },
//       packageDetails: {
//         description: order.items.map(i => i.productName).join(', '),
//         quantity: order.items.reduce((sum, i) => sum + i.quantity, 0),
//         weight: order.items.reduce((sum, i) => sum + (i.specifications?.weight || 0), 0)
//       },
//       scheduledPickupTime: scheduledPickupTime ? new Date(scheduledPickupTime) : null,
//       scheduledDeliveryTime: scheduledDeliveryTime ? new Date(scheduledDeliveryTime) : null,
//       instructions,
//       waypoints: parsedWaypoints,
//       distance: parseFloat(routeDistance) || 0,
//       estimatedDuration: parseInt(routeDuration) || 0,
//       status: 'assigned',
//       priority: order.priority,
//       createdBy: req.user._id
//     });

//     // Update order
//     order.deliveryId = delivery._id;
//     order.status = 'assigned';
//     await order.save();

//     // Mark driver unavailable
//     driver.isAvailable = false;
//     await driver.save();

//     // Status history
//     await DeliveryStatusHistory.create({
//       deliveryId: delivery._id,
//       status: 'assigned',
//       remarks: `Delivery assigned to ${driver.name} (${driver.vehicleNumber})`,
//       updatedBy: {
//         userId: req.user._id,
//         userRole: req.user.role,
//         userName: req.user.name
//       }
//     });

//     // Notification to driver
//     if (driver.userId) {
//       await Notification.create({
//         userId: driver.userId,
//         type: 'delivery_assigned',
//         title: 'New Delivery Assigned',
//         message: `You have been assigned delivery ${trackingNumber}. Check details in your app.`,
//         referenceId: delivery._id,
//         referenceModel: 'Delivery',
//         priority: 'high'
//       });
//     }

//     console.log('[CREATE-DELIVERY] Success:', trackingNumber);
//     req.flash('success', 'Delivery created and driver assigned successfully!');
//     res.redirect(`/admin/deliveries/${delivery._id}`);

//   } catch (error) {
//     console.error('[CREATE-DELIVERY] Error:', error);
//     req.flash('error', error.message || 'Failed to create delivery');
//     res.redirect(`/admin/orders/${req.params.orderId}/create-delivery`);
//   }
// };

// // ============= RENDER DELIVERIES LIST =============
// exports.renderDeliveriesList = async (req, res) => {
//   try {
//     const {
//       page = 1,
//       limit = 20,
//       status,
//       search,
//       startDate,
//       endDate
//     } = req.query;

//     const query = {};
//     if (status) query.status = status;

//     if (search) {
//       query.$or = [
//         { trackingNumber: { $regex: search, $options: 'i' } },
//         { orderId: { $regex: search, $options: 'i' } }
//       ];
//     }

//     if (startDate || endDate) {
//       query.createdAt = {};
//       if (startDate) query.createdAt.$gte = new Date(startDate);
//       if (endDate) query.createdAt.$lte = new Date(endDate);
//     }

//     const skip = (parseInt(page) - 1) * parseInt(limit);

//     const deliveries = await Delivery.find(query)
//       .populate({
//         path: 'customerId',
//         model: 'Customer',
//         select: 'name email phone companyName customerId'
//       })
//       .populate('driverId', 'name phone vehicleNumber')
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(parseInt(limit))
//       .lean();

//     const total = await Delivery.countDocuments(query);

//     // Statistics
//     const stats = await Delivery.aggregate([
//       {
//         $facet: {
//           total: [{ $count: 'count' }],
//           delivered: [{ $match: { status: 'delivered' } }, { $count: 'count' }],
//           inTransit: [
//             { $match: { status: { $in: ['in_transit', 'assigned', 'picked_up', 'out_for_delivery'] } } },
//             { $count: 'count' }
//           ],
//           pending: [{ $match: { status: { $in: ['pending', 'pending_acceptance'] } } }, { $count: 'count' }]
//         }
//       }
//     ]);

//     const statistics = {
//       total: stats[0].total[0]?.count || 0,
//       delivered: stats[0].delivered[0]?.count || 0,
//       inTransit: stats[0].inTransit[0]?.count || 0,
//       pending: stats[0].pending[0]?.count || 0
//     };

//     res.render('deliveries_list', { 
//       title: 'Deliveries Management',
//       user: req.user,
//       deliveries,
//       stats: statistics,
//       pagination: {
//         total,
//         page: parseInt(page),
//         pages: Math.ceil(total / parseInt(limit)),
//         limit: parseInt(limit)
//       },
//       filters: { status, search, startDate, endDate },
//       url: req.originalUrl,
//       messages: req.flash()
//     });

//   } catch (error) {
//     console.error('[DELIVERIES-LIST] Error:', error);
//     req.flash('error', 'Failed to load deliveries');
//     res.redirect('/admin/dashboard');
//   }
// };

// // ============= RENDER DELIVERY DETAILS =============
// exports.renderDeliveryDetails = async (req, res) => {
//   try {
//     const { deliveryId } = req.params;

//     if (!mongoose.Types.ObjectId.isValid(deliveryId)) {
//       req.flash('error', 'Invalid delivery ID');
//       return res.redirect('/admin/deliveries');
//     }

//     const delivery = await Delivery.findById(deliveryId)
//       .populate({
//         path: 'customerId',
//         model: 'Customer',
//         select: 'name email phone companyName customerId'
//       })
//       .populate('driverId', 'name phone vehicleNumber profileImage')
//       .populate('createdBy', 'name email')
//       .lean();

//     if (!delivery) {
//       req.flash('error', 'Delivery not found');
//       return res.redirect('/admin/deliveries');
//     }

//     // Get status history
//     const statusHistory = await DeliveryStatusHistory.find({ deliveryId: delivery._id })
//       .sort({ timestamp: -1 })
//       .populate('updatedBy.userId', 'name email')
//       .lean();

//     res.render('delivery_details', {
//       title: `Delivery ${delivery.trackingNumber}`,
//       user: req.user,
//       delivery,
//       statusHistory,
//       url: req.originalUrl,
//       messages: req.flash()
//     });

//   } catch (error) {
//     console.error('[DELIVERY-DETAILS] Error:', error);
//     req.flash('error', 'Failed to load delivery details');
//     res.redirect('/admin/deliveries');
//   }
// };

// // ============= GET LIVE DRIVER LOCATION (API) =============
// exports.getDriverLiveLocation = async (req, res) => {
//   try {
//     const { deliveryId } = req.params;

//     const delivery = await Delivery.findById(deliveryId)
//       .populate('driverId', 'currentLocation')
//       .lean();

//     if (!delivery || !delivery.driverId) {
//       return errorResponse(res, 'Delivery or driver not found', 404);
//     }

//     // Get driver's current location (assuming it's stored in Driver model)
//     const location = delivery.driverId.currentLocation || {
//       latitude: delivery.pickupLocation.coordinates.latitude,
//       longitude: delivery.pickupLocation.coordinates.longitude,
//       speed: 0,
//       timestamp: new Date()
//     };

//     return successResponse(res, 'Location retrieved', { location });

//   } catch (error) {
//     console.error('[LIVE-LOCATION] Error:', error);
//     return errorResponse(res, 'Failed to get location', 500);
//   }
// };

// // ============= UPDATE DELIVERY STATUS =============
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

//     const previousStatus = delivery.status;

//     // Update timestamps
//     if (status === 'picked_up' && !delivery.actualPickupTime) {
//       delivery.actualPickupTime = new Date();
//     }

//     if (status === 'delivered' && !delivery.actualDeliveryTime) {
//       delivery.actualDeliveryTime = new Date();

//       // Make driver available again
//       if (delivery.driverId) {
//         await Driver.findByIdAndUpdate(delivery.driverId, { isAvailable: true });
//       }
//     }

//     delivery.status = status;
//     await delivery.save();

//     // Create status history
//     await DeliveryStatusHistory.create({
//       deliveryId: delivery._id,
//       status,
//       previousStatus,
//       location,
//       remarks: remarks || `Status updated to ${status}`,
//       updatedBy: {
//         userId: req.user._id,
//         userRole: req.user.role,
//         userName: req.user.name
//       }
//     });

//     // Update linked order status
//     if (delivery.orderId) {
//       const orderStatusMap = {
//         'picked_up': 'in_transit',
//         'in_transit': 'in_transit',
//         'out_for_delivery': 'in_transit',
//         'delivered': 'delivered',
//         'cancelled': 'cancelled'
//       };

//       if (orderStatusMap[status]) {
//         await Order.updateOne(
//           { orderNumber: delivery.orderId },
//           { status: orderStatusMap[status] }
//         );
//       }
//     }

//     return successResponse(res, 'Status updated successfully', { delivery });

//   } catch (error) {
//     console.error('[UPDATE-STATUS] Error:', error);
//     return errorResponse(res, 'Failed to update status', 500);
//   }
// };

// // ============= EDIT DELIVERY =============
// exports.renderEditDelivery = async (req, res) => {
//   try {
//     const { deliveryId } = req.params;

//     const delivery = await Delivery.findById(deliveryId)
//       .populate('customerId')
//       .populate('driverId', 'name phone vehicleNumber')
//       .populate('orderId', 'orderNumber items priority')
//       .lean();

//     if (!delivery) {
//       req.flash('error', 'Delivery not found');
//       return res.redirect('/admin/deliveries');
//     }

//     // Get currently assigned driver + all available drivers (for possible reassignment)
//     const drivers = await Driver.find({
//       $or: [
//         { _id: delivery.driverId },
//         { isActive: true, isAvailable: true, profileStatus: 'approved' }
//       ]
//     })
//       .select('name phone vehicleNumber profileImage isAvailable')
//       .sort({ name: 1 })
//       .lean();

//     res.render('delivery_edit', {
//       title: `Edit Delivery - ${delivery.trackingNumber}`,
//       delivery,
//       drivers,
//       user: req.user,
//       url: req.originalUrl,
//       messages: req.flash()
//     });

//   } catch (error) {
//     console.error('[RENDER-EDIT-DELIVERY] Error:', error);
//     req.flash('error', 'Failed to load edit page');
//     res.redirect('/admin/deliveries');
//   }
// };

// exports.updateDelivery = async (req, res) => {
//   try {
//     const { deliveryId } = req.params;
//     const {
//       driverId, // allow driver change (optional)
//       scheduledPickupTime,
//       scheduledDeliveryTime,
//       instructions,
//       waypoints,
//       routeDistance,
//       routeDuration
//     } = req.body;

//     const delivery = await Delivery.findById(deliveryId);
//     if (!delivery) {
//       req.flash('error', 'Delivery not found');
//       return res.redirect('/admin/deliveries');
//     }

//     // Parse waypoints
//     let parsedWaypoints = [];
//     if (waypoints) {
//       try {
//         parsedWaypoints = JSON.parse(waypoints);
//       } catch (e) {
//         console.warn('Invalid waypoints JSON in edit:', e.message);
//       }
//     }

//     // Safe coordinates (same as create)
//     const DEFAULT_LAT = 23.0225;
//     const DEFAULT_LNG = 72.5714;

//     const pickupCoords = {
//       latitude: delivery.pickupLocation?.coordinates?.latitude ?? DEFAULT_LAT,
//       longitude: delivery.pickupLocation?.coordinates?.longitude ?? DEFAULT_LNG
//     };

//     const deliveryCoords = {
//       latitude: delivery.deliveryLocation?.coordinates?.latitude ?? DEFAULT_LAT,
//       longitude: delivery.deliveryLocation?.coordinates?.longitude ?? DEFAULT_LNG
//     };

//     // Optional: allow driver change
//     let driverChanged = false;
//     let oldDriverId = delivery.driverId?.toString();

//     if (driverId && driverId !== oldDriverId) {
//       const newDriver = await Driver.findById(driverId);
//       if (!newDriver || !newDriver.isAvailable) {
//         req.flash('error', 'Selected driver is not available');
//         return res.redirect(`/admin/deliveries/${deliveryId}/edit`);
//       }

//       // Free old driver if changing
//       if (oldDriverId) {
//         await Driver.findByIdAndUpdate(oldDriverId, { isAvailable: true });
//       }

//       // Assign new driver
//       delivery.driverId = driverId;
//       delivery.vehicleNumber = newDriver.vehicleNumber;
//       driverChanged = true;
//     }

//     // Update fields
//     delivery.scheduledPickupTime = scheduledPickupTime ? new Date(scheduledPickupTime) : delivery.scheduledPickupTime;
//     delivery.scheduledDeliveryTime = scheduledDeliveryTime ? new Date(scheduledDeliveryTime) : delivery.scheduledDeliveryTime;
//     delivery.instructions = instructions || delivery.instructions;
//     delivery.waypoints = parsedWaypoints.length > 0 ? parsedWaypoints : delivery.waypoints;
//     delivery.distance = parseFloat(routeDistance) || delivery.distance;
//     delivery.estimatedDuration = parseInt(routeDuration) || delivery.estimatedDuration;

//     await delivery.save();

//     // Create status history entry for edit
//     await DeliveryStatusHistory.create({
//       deliveryId: delivery._id,
//       status: delivery.status,
//       remarks: driverChanged 
//         ? 'Delivery updated + driver reassigned' 
//         : 'Delivery details updated (route/schedule)',
//       updatedBy: {
//         userId: req.user._id,
//         userRole: req.user.role,
//         userName: req.user.name
//       }
//     });

//     // Send notification to current driver
//     const currentDriver = await Driver.findById(delivery.driverId);
//     if (currentDriver?.userId) {
//       await Notification.create({
//         userId: currentDriver.userId,
//         type: 'delivery_updated',
//         title: 'Delivery Updated',
//         message: `Delivery ${delivery.trackingNumber} has been updated. Please check details in your app.`,
//         referenceId: delivery._id,
//         referenceModel: 'Delivery',
//         priority: 'medium'
//       });
//     }

//     req.flash('success', 'Delivery updated successfully!');
//     res.redirect(`/admin/deliveries/${delivery._id}`);

//   } catch (error) {
//     console.error('[UPDATE-DELIVERY] Error:', error);
//     req.flash('error', 'Failed to update delivery');
//     res.redirect(`/admin/deliveries/${req.params.deliveryId}/edit`);
//   }
// };

// // ============= CANCEL DELIVERY =============
// // exports.cancelDelivery = async (req, res) => {
// //   try {
// //     const { deliveryId } = req.params;
// //     const { remarks = 'Cancelled by admin' } = req.body;

// //     const delivery = await Delivery.findById(deliveryId);
// //     if (!delivery) {
// //       return res.status(404).json({ success: false, message: 'Delivery not found' });
// //     }

// //     if (['delivered', 'cancelled'].includes(delivery.status)) {
// //       req.flash('error', `Cannot cancel delivery in ${delivery.status} status`);
// //       return res.redirect(`/admin/deliveries/${deliveryId}`);
// //     }

// //     delivery.status = 'cancelled';
// //     await delivery.save();

// //     // Free the driver
// //     if (delivery.driverId) {
// //       await Driver.findByIdAndUpdate(delivery.driverId, { isAvailable: true });
// //     }

// //     // Update order status
// //     await Order.updateOne(
// //       { orderNumber: delivery.orderId },
// //       { status: 'cancelled' }
// //     );

// //     // Status history
// //     await DeliveryStatusHistory.create({
// //       deliveryId: delivery._id,
// //       status: 'cancelled',
// //       remarks: remarks,
// //       updatedBy: {
// //         userId: req.user._id,
// //         userRole: req.user.role,
// //         userName: req.user.name
// //       }
// //     });

// //     // Notify driver
// //     const driver = await Driver.findById(delivery.driverId);
// //     if (driver?.userId) {
// //       await Notification.create({
// //         userId: driver.userId,
// //         type: 'delivery_cancelled',
// //         title: 'Delivery Cancelled',
// //         message: `Delivery ${delivery.trackingNumber} has been cancelled. ${remarks}`,
// //         referenceId: delivery._id,
// //         referenceModel: 'Delivery',
// //         priority: 'high'
// //       });
// //     }

// //     req.flash('success', 'Delivery cancelled successfully');
// //     res.redirect('/admin/deliveries');

// //   } catch (error) {
// //     console.error('[CANCEL-DELIVERY] Error:', error);
// //     req.flash('error', 'Failed to cancel delivery');
// //     res.redirect('/admin/deliveries');
// //   }
// // };

// exports.cancelDelivery = async (req, res) => {
//   try {
//     const { deliveryId } = req.params;
//     const { remarks = 'Cancelled by admin' } = req.body;

//     const delivery = await Delivery.findById(deliveryId);
//     if (!delivery) {
//       return res.status(404).json({ success: false, message: 'Delivery not found' });
//     }

//     if (['delivered', 'cancelled'].includes(delivery.status)) {
//       return res.status(400).json({ 
//         success: false, 
//         message: `Cannot cancel delivery in ${delivery.status} status` 
//       });
//     }

//     // Update delivery status
//     delivery.status = 'cancelled';
//     await delivery.save();

//     // **Important** — Driver ko wapas available kar do
//     if (delivery.driverId) {
//       await Driver.findByIdAndUpdate(delivery.driverId, { 
//         isAvailable: true,
//         // optional: lastUpdated: new Date()
//       });
//     }

//     // Update linked order (optional but recommended)
//     if (delivery.orderId) {
//       await Order.updateOne(
//         { orderNumber: delivery.orderId },
//         { status: 'cancelled' }
//       );
//     }

//     // Status history
//     await DeliveryStatusHistory.create({
//       deliveryId: delivery._id,
//       status: 'cancelled',
//       remarks: remarks,
//       updatedBy: {
//         userId: req.user._id,
//         userRole: req.user.role,
//         userName: req.user.name
//       }
//     });

//     // Notification to driver (very important)
//     const driver = await Driver.findById(delivery.driverId);
//     if (driver?.userId) {
//       await Notification.create({
//         userId: driver.userId,
//         type: 'delivery_cancelled',
//         title: 'Delivery Cancelled',
//         message: `Your assigned delivery ${delivery.trackingNumber} has been cancelled by admin.\nReason: ${remarks}`,
//         referenceId: delivery._id,
//         referenceModel: 'Delivery',
//         priority: 'high'
//       });
//     }

//     return res.json({ 
//       success: true, 
//       message: 'Delivery cancelled successfully. Driver is now available again.' 
//     });

//   } catch (error) {
//     console.error('[CANCEL-DELIVERY] Error:', error);
//     return res.status(500).json({ success: false, message: 'Failed to cancel delivery' });
//   }
// };

// // ============= COMPLETE WAYPOINT =============
// exports.completeWaypoint = async (req, res) => {
//   try {
//     const { deliveryId, waypointIndex } = req.params;
//     const { remarks, photo } = req.body;

//     const delivery = await Delivery.findById(deliveryId);
//     if (!delivery) {
//       return errorResponse(res, 'Delivery not found', 404);
//     }

//     if (!delivery.waypoints || !delivery.waypoints[waypointIndex]) {
//       return errorResponse(res, 'Waypoint not found', 404);
//     }

//     delivery.waypoints[waypointIndex].completed = true;
//     delivery.waypoints[waypointIndex].completedAt = new Date();
//     delivery.waypoints[waypointIndex].remarks = remarks;
//     if (photo) delivery.waypoints[waypointIndex].photo = photo;

//     await delivery.save();

//     return successResponse(res, 'Waypoint marked as completed', { waypoint: delivery.waypoints[waypointIndex] });

//   } catch (error) {
//     console.error('[COMPLETE-WAYPOINT] Error:', error);
//     return errorResponse(res, 'Failed to complete waypoint', 500);
//   }
// };

// // ============= SUBMIT DELIVERY PROOF =============
// exports.submitDeliveryProof = async (req, res) => {
//   try {
//     const { deliveryId } = req.params;
//     const { signature, photos, receiverName, otp } = req.body;

//     const delivery = await Delivery.findById(deliveryId);
//     if (!delivery) {
//       return errorResponse(res, 'Delivery not found', 404);
//     }

//     if (delivery.status !== 'out_for_delivery') {
//       return errorResponse(res, 'Delivery must be out for delivery to submit proof', 400);
//     }

//     // Verify OTP if provided
//     let otpVerified = false;
//     if (otp && delivery.deliveryProof?.otp) {
//       otpVerified = (otp === delivery.deliveryProof.otp);
//     }

//     delivery.deliveryProof = {
//       signature,
//       photos: photos || [],
//       receiverName,
//       otpVerified
//     };

//     delivery.status = 'delivered';
//     delivery.actualDeliveryTime = new Date();

//     await delivery.save();

//     // Make driver available
//     if (delivery.driverId) {
//       await Driver.findByIdAndUpdate(delivery.driverId, { isAvailable: true });
//     }

//     // Update order
//     if (delivery.orderId) {
//       await Order.updateOne(
//         { orderNumber: delivery.orderId },
//         { status: 'delivered' }
//       );
//     }

//     // Create status history
//     await DeliveryStatusHistory.create({
//       deliveryId: delivery._id,
//       status: 'delivered',
//       previousStatus: 'out_for_delivery',
//       remarks: `Delivered to ${receiverName}. OTP ${otpVerified ? 'verified' : 'not verified'}.`,
//       updatedBy: {
//         userId: req.user._id,
//         userRole: req.user.role,
//         userName: req.user.name
//       }
//     });

//     return successResponse(res, 'Delivery completed successfully!', { delivery });

//   } catch (error) {
//     console.error('[SUBMIT-PROOF] Error:', error);
//     return errorResponse(res, 'Failed to submit delivery proof', 500);
//   }
// };

// // ============= ADD DELIVERY REMARK =============
// exports.addDeliveryRemark = async (req, res) => {
//   try {
//     const { deliveryId } = req.params;
//     const { message, images } = req.body;

//     const delivery = await Delivery.findById(deliveryId);
//     if (!delivery) {
//       return errorResponse(res, 'Delivery not found', 404);
//     }

//     const remark = {
//       message,
//       images: images || [],
//       createdBy: req.user._id,
//       createdAt: new Date()
//     };

//     if (!delivery.remarks) delivery.remarks = [];
//     delivery.remarks.push(remark);

//     await delivery.save();

//     return successResponse(res, 'Remark added successfully', { remark });

//   } catch (error) {
//     console.error('[ADD-REMARK] Error:', error);
//     return errorResponse(res, 'Failed to add remark', 500);
//   }
// };

// module.exports = exports;


const Delivery = require('../../models/Delivery');
const Order = require('../../models/Order');
const Driver = require('../../models/Driver');
const Customer = require('../../models/Customer');
const DeliveryStatusHistory = require('../../models/DeliveryStatusHistory');
const Notification = require('../../models/Notification');
const mongoose = require('mongoose');
const { successResponse, errorResponse } = require('../../utils/responseHelper');
const { sendNotification } = require("../../utils/sendNotification")

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
      .populate({
        path: 'driverId',
        select: 'name phone vehicleNumber profileImage currentLocation'
      })
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

// ============= RENDER CREATE DELIVERY FROM ORDER =============
exports.renderCreateDeliveryFromOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      req.flash('error', 'Invalid order ID');
      return res.redirect('/admin/orders');
    }

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

    const existingDelivery = await Delivery.findOne({ orderId: order.orderNumber });
    if (existingDelivery) {
      req.flash('error', 'Delivery already exists for this order');
      return res.redirect(`/admin/deliveries/${existingDelivery._id}`);
    }

    // Ensure coordinates exist with fallback
    if (!order.pickupLocation?.coordinates) {
      order.pickupLocation = order.pickupLocation || {};
      order.pickupLocation.coordinates = { latitude: 23.0225, longitude: 72.5714 };
    }

    if (!order.deliveryLocation?.coordinates) {
      order.deliveryLocation = order.deliveryLocation || {};
      order.deliveryLocation.coordinates = { latitude: 23.0225, longitude: 72.5714 };
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
// ============= CREATE DELIVERY FROM ORDER =============
// exports.createDeliveryFromOrder = async (req, res) => {
//   try {
//     const { orderId } = req.params;
//     const {
//       customerId,
//       driverId,
//       scheduledPickupTime,
//       scheduledDeliveryTime,
//       instructions,
//       waypoints,
//       routeDistance,
//       routeDuration
//     } = req.body;

//     const order = await Order.findById(orderId)
//       .populate({
//         path: 'customerId',
//         model: 'Customer'
//       });

//     if (!order) {
//       req.flash('error', 'Order not found');
//       return res.redirect('/admin/orders');
//     }

//     const existing = await Delivery.findOne({ orderId: order.orderNumber });
//     if (existing) {
//       req.flash('error', 'Delivery already exists for this order');
//       return res.redirect(`/admin/deliveries/${existing._id}`);
//     }

//     const driver = await Driver.findById(driverId);
//     if (!driver || !driver.isAvailable || driver.profileStatus !== 'approved') {
//       req.flash('error', 'Driver is not available or not approved');
//       return res.redirect(`/admin/orders/${orderId}/create-delivery`);
//     }

//     // Generate tracking number
//     const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
//     const random = Math.floor(1000 + Math.random() * 9000);
//     const trackingNumber = `DEL${dateStr}${random}`;

//     // Parse waypoints
//     let parsedWaypoints = [];
//     if (waypoints) {
//       try {
//         parsedWaypoints = JSON.parse(waypoints);
//       } catch (e) {
//         console.error('Waypoints parse error:', e);
//       }
//     }

//     // Safe coordinate extraction
//     const pickupCoords = {
//       latitude: order?.pickupLocation?.coordinates?.latitude || 23.0225,
//       longitude: order?.pickupLocation?.coordinates?.longitude || 72.5714
//     };

//     const deliveryCoords = {
//       latitude: order?.deliveryLocation?.coordinates?.latitude || 23.0225,
//       longitude: order?.deliveryLocation?.coordinates?.longitude || 72.5714
//     };

//     // Create delivery
//     const delivery = await Delivery.create({
//       trackingNumber,
//       orderId: order.orderNumber,
//       customerId: order.customerId?._id || null,
//       driverId,
//       vehicleNumber: driver.vehicleNumber,
//       pickupLocation: {
//         ...order.pickupLocation,
//         coordinates: pickupCoords
//       },
//       deliveryLocation: {
//         ...order.deliveryLocation,
//         coordinates: deliveryCoords
//       },
//       packageDetails: {
//         description: order.items?.map(i => i.productName).join(', ') || 'Package',
//         quantity: order.items?.reduce((sum, i) => sum + (i.quantity || 0), 0) || 1,
//         weight: order.items?.reduce((sum, i) => sum + (i.specifications?.weight || 0), 0) || 0
//       },
//       scheduledPickupTime: scheduledPickupTime ? new Date(scheduledPickupTime) : null,
//       scheduledDeliveryTime: scheduledDeliveryTime ? new Date(scheduledDeliveryTime) : null,
//       instructions,
//       waypoints: parsedWaypoints,
//       distance: parseFloat(routeDistance) || 0,
//       estimatedDuration: parseInt(routeDuration) || 0,
//       status: 'assigned',
//       priority: order.priority || 'medium',
//       createdBy: req.user._id
//     });

//     // Update order
//     order.deliveryId = delivery._id;
//     order.status = 'assigned';
//     await order.save();

//     // Mark driver as unavailable
//     driver.isAvailable = false;
//     await driver.save();

//     // Create status history
//     await DeliveryStatusHistory.create({
//       deliveryId: delivery._id,
//       status: 'assigned',
//       remarks: `Delivery assigned to ${driver.name} (${driver.vehicleNumber})`,
//       updatedBy: {
//         userId: req.user._id,
//         userRole: req.user.role,
//         userName: req.user.name
//       }
//     });

//     // ───────────────────────────────────────────────
//     //          NOTIFICATIONS – BOTH PUSH + IN-APP
//     // ───────────────────────────────────────────────
//     console.log("Saving notification with userId type:", typeof driverId, driverId);
//     console.log("userId instanceof ObjectId:", driverId instanceof mongoose.Types.ObjectId);
//     console.log(`[NOTIF-DEBUG] Preparing notifications for driver ${driver._id} (${driver.name})`);

//     // 1. Push Notification (FCM)
//     if (driver.fcmToken?.trim()) {
//       console.log(`[NOTIF-DEBUG] Sending FCM to token: ${driver.fcmToken.substring(0, 20)}...`);
//       try {
//         const pushResult = await sendNotification(
//           driver.name || "Driver",
//           "english",
//           driver.fcmToken,
//           "delivery_assigned",
//           {
//             deliveryId: delivery._id.toString(),
//             trackingNumber: delivery.trackingNumber,
//             customerName: order?.customerId?.name || "Customer",
//             pickup: order?.pickupLocation?.address || "",
//             type: "delivery_assigned"
//           }
//         );

//         if (pushResult) {
//           console.log(`[NOTIF-SUCCESS] FCM push sent → messageId: ${pushResult.messageId}`);
//         } else {
//           console.warn("[NOTIF-WARN] FCM returned null/undefined");
//         }
//       } catch (pushErr) {
//         console.error("[NOTIF-ERROR] FCM failed:", pushErr.message || pushErr);
//       }
//     } else {
//       console.warn("[NOTIF-WARN] No valid fcmToken found for driver");
//     }


//     // 2. In-app Notification (bell icon list)
//     try {
//       const notificationDoc = await Notification.create({
//         userId: driverId,                    // ← using driver._id directly – no need for separate userId field
//         type: 'delivery_assigned',
//         title: 'New Delivery Assigned',
//         message: `You have been assigned delivery ${delivery.trackingNumber}. Check details in your app.`,
//         referenceId: delivery._id,
//         referenceModel: 'Delivery',
//         priority: 'high',
//         createdAt: new Date()
//       });

//       console.log(`[NOTIF-SUCCESS] In-app notification created → _id: ${notificationDoc._id}`);
//     } catch (notifErr) {
//       console.error("[NOTIF-ERROR] Failed to create in-app notification:", notifErr.message || notifErr);
//     }

//     console.log('[CREATE-DELIVERY] Success:', delivery.trackingNumber);
//     req.flash('success', 'Delivery created and driver assigned successfully!');
//     res.redirect(`/admin/deliveries/${delivery._id}`);

//   } catch (error) {
//     console.error('[CREATE-DELIVERY] Error:', error);
//     req.flash('error', error.message || 'Failed to create delivery');
//     res.redirect(`/admin/orders/${req.params.orderId}/create-delivery`);
//   }
// };

// ============= CREATE DELIVERY FROM ORDER =============
// exports.createDeliveryFromOrder = async (req, res) => {
//   try {
//     const { orderId } = req.params;
//     const {
//       customerId,
//       driverId,
//       scheduledPickupTime,
//       scheduledDeliveryTime,
//       instructions,
//       waypoints,
//       routeDistance,
//       routeDuration
//     } = req.body;

//     const order = await Order.findById(orderId)
//       .populate({
//         path: 'customerId',
//         model: 'Customer'
//       });

//     if (!order) {
//       req.flash('error', 'Order not found');
//       return res.redirect('/admin/orders');
//     }

//     const existing = await Delivery.findOne({ orderId: order.orderNumber });
//     if (existing) {
//       req.flash('error', 'Delivery already exists for this order');
//       return res.redirect(`/admin/deliveries/${existing._id}`);
//     }

//     const driver = await Driver.findById(driverId);
//     if (!driver || !driver.isAvailable || driver.profileStatus !== 'approved') {
//       req.flash('error', 'Driver is not available or not approved');
//       return res.redirect(`/admin/orders/${orderId}/create-delivery`);
//     }

//     // Generate tracking number
//     const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
//     const random = Math.floor(1000 + Math.random() * 9000);
//     const trackingNumber = `DEL${dateStr}${random}`;

//     // Parse waypoints
//     let parsedWaypoints = [];
//     if (waypoints) {
//       try {
//         parsedWaypoints = JSON.parse(waypoints);
//       } catch (e) {
//         console.error('Waypoints parse error:', e);
//       }
//     }

//     // Safe coordinate extraction
//     const pickupCoords = {
//       latitude: order?.pickupLocation?.coordinates?.latitude || 23.0225,
//       longitude: order?.pickupLocation?.coordinates?.longitude || 72.5714
//     };

//     const deliveryCoords = {
//       latitude: order?.deliveryLocation?.coordinates?.latitude || 23.0225,
//       longitude: order?.deliveryLocation?.coordinates?.longitude || 72.5714
//     };

//     // Create delivery
//     const delivery = await Delivery.create({
//       trackingNumber,
//       orderId: order.orderNumber,
//       customerId: order.customerId?._id || null,
//       driverId,
//       vehicleNumber: driver.vehicleNumber,
//       pickupLocation: {
//         ...order.pickupLocation,
//         coordinates: pickupCoords
//       },
//       deliveryLocation: {
//         ...order.deliveryLocation,
//         coordinates: deliveryCoords
//       },
//       packageDetails: {
//         description: order.items?.map(i => i.productName).join(', ') || 'Package',
//         quantity: order.items?.reduce((sum, i) => sum + (i.quantity || 0), 0) || 1,
//         weight: order.items?.reduce((sum, i) => sum + (i.specifications?.weight || 0), 0) || 0
//       },
//       scheduledPickupTime: scheduledPickupTime ? new Date(scheduledPickupTime) : null,
//       scheduledDeliveryTime: scheduledDeliveryTime ? new Date(scheduledDeliveryTime) : null,
//       instructions,
//       waypoints: parsedWaypoints,
//       distance: parseFloat(routeDistance) || 0,
//       estimatedDuration: parseInt(routeDuration) || 0,
//       status: 'assigned',
//       priority: order.priority || 'medium',
//       createdBy: req.user._id
//     });

//     // Update order
//     order.deliveryId = delivery._id;
//     order.status = 'assigned';
//     await order.save();

//     // Mark driver as unavailable
//     driver.isAvailable = false;
//     await driver.save();

//     // Create status history
//     await DeliveryStatusHistory.create({
//       deliveryId: delivery._id,
//       status: 'assigned',
//       remarks: `Delivery assigned to ${driver.name} (${driver.vehicleNumber})`,
//       updatedBy: {
//         userId: req.user._id,
//         userRole: req.user.role,
//         userName: req.user.name
//       }
//     });

//     // ───────────────────────────────────────────────
//     //          NOTIFICATIONS – BOTH PUSH + IN-APP
//     // ───────────────────────────────────────────────
//     console.log("Saving notification with driverId type:", typeof driver._id, driver._id);
//     console.log("driver._id instanceof ObjectId:", driver._id instanceof mongoose.Types.ObjectId);
//     console.log(`[NOTIF-DEBUG] Preparing notifications for driver ${driver._id} (${driver.name})`);

//     // 1. Push Notification (FCM)
//     if (driver.fcmToken && driver.fcmToken.trim().length > 20) {  // better length check
//       console.log(`[FCM-DEBUG] Attempting to send to token (first 20 chars): ${driver.fcmToken.substring(0, 20)}...`);
//       try {
//         const pushResult = await sendNotification(
//           driver.name || "Driver",
//           "english",
//           driver.fcmToken,
//           "delivery_assigned",
//           {
//             deliveryId: delivery._id.toString(),
//             trackingNumber: delivery.trackingNumber,
//             customerName: order?.customerId?.name || "Customer",
//             pickup: order?.pickupLocation?.address || "",
//             type: "delivery_assigned"
//           }
//         );

//         if (pushResult) {
//           console.log(`[NOTIF-SUCCESS] FCM push sent → messageId: ${pushResult.messageId || pushResult.name}`);
//         } else {
//           console.warn("[NOTIF-WARN] FCM send returned null/undefined");
//         }
//       } catch (pushErr) {
//         console.error("[FCM-ERROR] Push failed:", pushErr.code || pushErr.message || pushErr);
//       }
//     } else {
//       console.warn("[NOTIF-WARN] No valid fcmToken found for driver", {
//         hasToken: !!driver.fcmToken,
//         tokenLength: driver.fcmToken?.length || 0
//       });
//     }

//     // 2. In-app Notification – FIXED: use ObjectId
//     try {
//       const notificationDoc = await Notification.create({
//         userId: driver._id,                         // ← driver._id is already ObjectId
//         // userId: mongoose.Types.ObjectId(driverId),  // ← alternative if driverId is string
//         type: 'delivery_assigned',
//         title: 'New Delivery Assigned',
//         message: `You have been assigned delivery ${delivery.trackingNumber}. Check details in your app.`,
//         referenceId: delivery._id,
//         referenceModel: 'Delivery',
//         priority: 'high',
//         createdAt: new Date()
//       });

//       console.log(`[NOTIF-SUCCESS] In-app notification created → _id: ${notificationDoc._id}`);
//     } catch (notifErr) {
//       console.error("[NOTIF-ERROR] Failed to create in-app notification:", notifErr.message || notifErr);
//     }

//     console.log('[CREATE-DELIVERY] Success:', delivery.trackingNumber);
//     req.flash('success', 'Delivery created and driver assigned successfully!');
//     res.redirect(`/admin/deliveries/${delivery._id}`);

//   } catch (error) {
//     console.error('[CREATE-DELIVERY] Error:', error);
//     req.flash('error', error.message || 'Failed to create delivery');
//     res.redirect(`/admin/orders/${req.params.orderId}/create-delivery`);
//   }
// };

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

    const order = await Order.findById(orderId)
      .populate({
        path: 'customerId',
        model: 'Customer'
      });

    if (!order) {
      req.flash('error', 'Order not found');
      return res.redirect('/admin/orders');
    }

    const existing = await Delivery.findOne({ orderId: order.orderNumber });
    if (existing) {
      req.flash('error', 'Delivery already exists for this order');
      return res.redirect(`/admin/deliveries/${existing._id}`);
    }

    const driver = await Driver.findById(driverId);
    if (!driver || !driver.isAvailable || driver.profileStatus !== 'approved') {
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

    // Safe coordinate extraction
    const pickupCoords = {
      latitude: order?.pickupLocation?.coordinates?.latitude || 23.0225,
      longitude: order?.pickupLocation?.coordinates?.longitude || 72.5714
    };

    const deliveryCoords = {
      latitude: order?.deliveryLocation?.coordinates?.latitude || 23.0225,
      longitude: order?.deliveryLocation?.coordinates?.longitude || 72.5714
    };

    // Create delivery
    const delivery = await Delivery.create({
      trackingNumber,
      orderId: order.orderNumber,
      customerId: order.customerId?._id || null,
      driverId,
      vehicleNumber: driver.vehicleNumber,
      pickupLocation: {
        ...order.pickupLocation,
        coordinates: pickupCoords
      },
      deliveryLocation: {
        ...order.deliveryLocation,
        coordinates: deliveryCoords
      },
      packageDetails: {
        description: order.items?.map(i => i.productName).join(', ') || 'Package',
        quantity: order.items?.reduce((sum, i) => sum + (i.quantity || 0), 0) || 1,
        weight: order.items?.reduce((sum, i) => sum + (i.specifications?.weight || 0), 0) || 0
      },
      scheduledPickupTime: scheduledPickupTime ? new Date(scheduledPickupTime) : null,
      scheduledDeliveryTime: scheduledDeliveryTime ? new Date(scheduledDeliveryTime) : null,
      instructions,
      waypoints: parsedWaypoints,
      distance: parseFloat(routeDistance) || 0,
      estimatedDuration: parseInt(routeDuration) || 0,
      status: 'assigned',
      priority: order.priority || 'medium',
      createdBy: req.user._id
    });

    // Update order
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

    // ───────────────────────────────────────────────
    //          NOTIFICATIONS – BOTH PUSH + IN-APP
    // ───────────────────────────────────────────────
    console.log("Saving notification with driverId type:", typeof driver._id, driver._id);
    console.log("driver._id instanceof ObjectId:", driver._id instanceof mongoose.Types.ObjectId);
    console.log(`[NOTIF-DEBUG] Preparing notifications for driver ${driver._id} (${driver.name})`);

    // ──── ADD THE DEBUG LINES HERE ────
    console.log("[FCM-CHECK] Token status:", driver.fcmToken ? "present" : "missing");
    if (!driver.fcmToken) {
      console.log("[FCM-CHECK-DETAIL] No token found in driver document");
      // driver.fcmToken = "fake-test-token-1234567890"; // ← uncomment ONLY for testing (will skip warn but FCM will fail)
    }

    // 1. Push Notification (FCM)
    if (driver.fcmToken && driver.fcmToken.trim().length > 20) {
      console.log(`[FCM-DEBUG] Attempting send to token (preview): ${driver.fcmToken.substring(0, 20)}...`);
      try {
        const pushResult = await sendNotification(
          driver.name || "Driver",
          "english",
          driver.fcmToken,
          "delivery_assigned",
          {
            deliveryId: delivery._id.toString(),
            trackingNumber: delivery.trackingNumber,
            customerName: order?.customerId?.name || "Customer",
            pickup: order?.pickupLocation?.address || "",
            type: "delivery_assigned"
          }
        );

        if (pushResult) {
          console.log(`[NOTIF-SUCCESS] FCM push sent → messageId: ${pushResult.messageId || pushResult.name}`);
        } else {
          console.warn("[NOTIF-WARN] FCM send returned null/undefined");
        }
      } catch (pushErr) {
        console.error("[FCM-ERROR] Push failed:", pushErr.code || pushErr.message || pushErr);
      }
    } else {
      console.warn("[NOTIF-WARN] No valid fcmToken found for driver", {
        hasToken: !!driver.fcmToken,
        tokenLength: driver.fcmToken?.length || 0
      });
    }

    // 2. In-app Notification
    try {
      const notificationDoc = await Notification.create({
        recipientId: driver._id,          // matches your schema
        recipientType: 'Driver',          // required for refPath
        type: 'delivery_assigned',
        title: 'New Delivery Assigned',
        message: `You have been assigned delivery ${delivery.trackingNumber}. Check details in your app.`,
        referenceId: delivery._id,
        referenceModel: 'Delivery',
        priority: 'high',
        createdAt: new Date()
      });

      console.log(`[NOTIF-SUCCESS] In-app notification created → _id: ${notificationDoc._id}`);
    } catch (notifErr) {
      console.error("[NOTIF-ERROR] Failed to create in-app notification:", notifErr.message || notifErr);
    }

    console.log('[CREATE-DELIVERY] Success:', delivery.trackingNumber);
    req.flash('success', 'Delivery created and driver assigned successfully!');
    res.redirect(`/admin/deliveries/${delivery._id}`);

  } catch (error) {
    console.error('[CREATE-DELIVERY] Error:', error);
    req.flash('error', error.message || 'Failed to create delivery');
    res.redirect(`/admin/orders/${req.params.orderId}/create-delivery`);
  }
};

// ============= CANCEL DELIVERY (ADMIN CAN ONLY CANCEL) =============
// ============= CANCEL DELIVERY (ADMIN CAN ONLY CANCEL) =============
// exports.cancelDelivery = async (req, res) => {
//   try {
//     const { deliveryId } = req.params;
//     const { remarks = 'Cancelled by admin' } = req.body;

//     const delivery = await Delivery.findById(deliveryId);
//     if (!delivery) {
//       return res.status(404).json({ success: false, message: 'Delivery not found' });
//     }

//     if (['delivered', 'cancelled'].includes(delivery.status)) {
//       return res.status(400).json({
//         success: false,
//         message: `Cannot cancel delivery in ${delivery.status} status`
//       });
//     }

//     const previousStatus = delivery.status;
//     delivery.status = 'cancelled';
//     await delivery.save();

//     // ────────────────────────────────────────────────
//     // Fetch the driver document (this was missing!)
//     // ────────────────────────────────────────────────
//     let driver = null;
//     if (delivery.driverId) {
//       driver = await Driver.findById(delivery.driverId).select('name fcmToken userId');

//       // Free the driver
//       await Driver.findByIdAndUpdate(delivery.driverId, {
//         isAvailable: true
//       });
//     }

//     // Update order status
//     if (delivery.orderId) {
//       await Order.updateOne(
//         { orderNumber: delivery.orderId },
//         { status: 'cancelled' }
//       );
//     }

//     // Status history
//     await DeliveryStatusHistory.create({
//       deliveryId: delivery._id,
//       status: 'cancelled',
//       previousStatus: previousStatus,
//       remarks: remarks,
//       updatedBy: {
//         userId: req.user._id,
//         userRole: req.user.role,
//         userName: req.user.name
//       }
//     });

//     // ────────────────────────────────────────────────
//     // NOTIFICATIONS – only if driver exists
//     // ────────────────────────────────────────────────
//     if (driver) {
//       console.log(`[CANCEL-NOTIF] Preparing notifications for driver ${driver._id} (${driver.name})`);

//       // 1. Push Notification (FCM)
//       if (driver.fcmToken?.trim()) {
//         try {
//           await sendNotification(
//             driver.name || "Driver",
//             "english",
//             driver.fcmToken,
//             "delivery_cancelled",
//             {
//               deliveryId: delivery._id.toString(),
//               trackingNumber: delivery.trackingNumber,
//               reason: remarks,
//               type: "delivery_cancelled"
//             }
//           );
//           console.log(`[CANCEL-NOTIF] FCM push sent to ${driver._id}`);
//         } catch (pushErr) {
//           console.error("[CANCEL-NOTIF-ERROR] FCM failed:", pushErr.message || pushErr);
//         }
//       } else {
//         console.warn("[CANCEL-NOTIF] No fcmToken for driver");
//       }

//       // 2. In-app Notification (using driver._id directly – no need for userId field)
//       try {
//         const notif = await Notification.create({
//           userId: driver._id,                    // ← fixed: use driver._id
//           type: 'delivery_cancelled',
//           title: 'Delivery Cancelled',
//           message: `Your assigned delivery ${delivery.trackingNumber} has been cancelled.\nReason: ${remarks}`,
//           referenceId: delivery._id,
//           referenceModel: 'Delivery',
//           priority: 'high',
//           createdAt: new Date()
//         });
//         console.log(`[CANCEL-NOTIF] In-app notification created → ID: ${notif._id}`);
//       } catch (notifErr) {
//         console.error("[CANCEL-NOTIF-ERROR] Failed to create notification:", notifErr.message || notifErr);
//       }
//     } else {
//       console.warn("[CANCEL-NOTIF] No driver found for this delivery");
//     }

//     // Emit socket event
//     if (global.io && driver) {
//       global.io.to('admin-room').emit('delivery:status:update', {
//         deliveryId: delivery._id,
//         status: 'cancelled',
//         timestamp: new Date()
//       });

//       global.io.to('admin-room').emit('driver:available', {
//         driverId: delivery.driverId,
//         driverName: driver.name,
//         status: 'available'
//       });
//     }

//     return res.json({
//       success: true,
//       message: 'Delivery cancelled successfully. Driver is now available again.'
//     });

//   } catch (error) {
//     console.error('[CANCEL-DELIVERY] Error:', error);
//     return res.status(500).json({ success: false, message: 'Failed to cancel delivery' });
//   }
// };

// ============= CANCEL DELIVERY (ADMIN CAN ONLY CANCEL) =============
exports.cancelDelivery = async (req, res) => {
  try {
    const { deliveryId } = req.params;
    const { remarks = 'Cancelled by admin' } = req.body;

    const delivery = await Delivery.findById(deliveryId);
    if (!delivery) {
      return res.status(404).json({ success: false, message: 'Delivery not found' });
    }

    if (['delivered', 'cancelled'].includes(delivery.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel delivery in ${delivery.status} status`
      });
    }

    const previousStatus = delivery.status;
    delivery.status = 'cancelled';
    await delivery.save();

    // Fetch driver
    let driver = null;
    if (delivery.driverId) {
      driver = await Driver.findById(delivery.driverId).select('name fcmToken');
      
      // Free the driver
      await Driver.findByIdAndUpdate(delivery.driverId, {
        isAvailable: true,
        $unset: { currentLocation: "" } // optional: clear live location
      });
    }

    // Update order if linked
    if (delivery.orderId) {
      await Order.updateOne(
        { orderNumber: delivery.orderId },
        { status: 'cancelled' }
      );
    }

    // Status history
    await DeliveryStatusHistory.create({
      deliveryId: delivery._id,
      status: 'cancelled',
      previousStatus: previousStatus,
      remarks: remarks,
      updatedBy: {
        userId: req.user._id,
        userRole: req.user.role,
        userName: req.user.name
      }
    });

    // ────────────────────────────────────────────────
    // NOTIFICATIONS – only if driver exists
    // ────────────────────────────────────────────────
    if (driver) {
      console.log(`[CANCEL-NOTIF] Preparing for driver ${driver._id} (${driver.name})`);

      // 1. Push Notification (FCM)
      if (driver.fcmToken && driver.fcmToken.trim().length > 20) {
        console.log(`[CANCEL-FCM] Attempting send to: ${driver.fcmToken.substring(0, 20)}...`);
        try {
          const result = await sendNotification(
            driver.name || "Driver",
            "english",
            driver.fcmToken,
            "delivery_cancelled",
            {
              deliveryId: delivery._id.toString(),
              trackingNumber: delivery.trackingNumber,
              reason: remarks,
              type: "delivery_cancelled"
            }
          );
          console.log(`[CANCEL-NOTIF-SUCCESS] FCM sent → ${result?.messageId || 'ok'}`);
        } catch (pushErr) {
          console.error("[CANCEL-FCM-ERROR]", pushErr.code || pushErr.message || pushErr);
        }
      } else {
        console.warn("[CANCEL-NOTIF] No valid fcmToken", { length: driver.fcmToken?.length || 0 });
      }

      // 2. In-app Notification (consistent with schema)
      try {
        const notif = await Notification.create({
          recipientId: driver._id,
          recipientType: 'Driver',
          type: 'delivery_cancelled',
          title: 'Delivery Cancelled',
          message: `Your assigned delivery ${delivery.trackingNumber} has been cancelled.\nReason: ${remarks}`,
          referenceId: delivery._id,
          referenceModel: 'Delivery',
          priority: 'high',
          createdAt: new Date()
        });
        console.log(`[CANCEL-NOTIF-SUCCESS] In-app created → ID: ${notif._id}`);
      } catch (notifErr) {
        console.error("[CANCEL-NOTIF-ERROR]", notifErr.message || notifErr);
      }
    } else {
      console.warn("[CANCEL-NOTIF] No driver attached to delivery");
    }

    // Socket emit (if using)
    if (global.io && driver) {
      global.io.to('admin-room').emit('delivery:status:update', {
        deliveryId: delivery._id,
        status: 'cancelled',
        timestamp: new Date()
      });

      global.io.to('admin-room').emit('driver:available', {
        driverId: delivery.driverId,
        driverName: driver.name,
        status: 'available'
      });
    }

    return res.json({
      success: true,
      message: 'Delivery cancelled successfully. Driver is now available again.'
    });

  } catch (error) {
    console.error('[CANCEL-DELIVERY] Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to cancel delivery' });
  }
};

// ============= GET DRIVER'S CURRENT LOCATION (API) =============
exports.getDriverCurrentLocation = async (req, res) => {
  try {
    const { deliveryId } = req.params;

    const delivery = await Delivery.findById(deliveryId)
      .populate({
        path: 'driverId',
        select: 'currentLocation name vehicleNumber'
      })
      .lean();

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Delivery not found'
      });
    }

    if (!delivery.driverId) {
      return res.status(404).json({
        success: false,
        message: 'No driver assigned to this delivery'
      });
    }

    // Return driver's current location from Driver model
    const location = delivery.driverId.currentLocation || null;

    return res.json({
      success: true,
      data: {
        driverId: delivery.driverId._id,
        driverName: delivery.driverId.name,
        vehicleNumber: delivery.driverId.vehicleNumber,
        currentLocation: location,
        deliveryStatus: delivery.status,
        lastUpdate: location?.timestamp || null
      }
    });

  } catch (error) {
    console.error('[GET-DRIVER-LOCATION] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get driver location'
    });
  }
};

// ============= EDIT DELIVERY =============
exports.renderEditDelivery = async (req, res) => {
  try {
    const { deliveryId } = req.params;

    const delivery = await Delivery.findById(deliveryId)
      .populate('customerId')
      .populate('driverId', 'name phone vehicleNumber')
      .lean();

    if (!delivery) {
      req.flash('error', 'Delivery not found');
      return res.redirect('/admin/deliveries');
    }

    // Get available drivers (current driver + all available ones)
    const drivers = await Driver.find({
      $or: [
        { _id: delivery.driverId },
        { isActive: true, isAvailable: true, profileStatus: 'approved' }
      ]
    })
      .select('name phone vehicleNumber profileImage isAvailable')
      .sort({ name: 1 })
      .lean();

    res.render('delivery_edit', {
      title: `Edit Delivery - ${delivery.trackingNumber}`,
      delivery,
      drivers,
      user: req.user,
      url: req.originalUrl,
      messages: req.flash()
    });

  } catch (error) {
    console.error('[RENDER-EDIT-DELIVERY] Error:', error);
    req.flash('error', 'Failed to load edit page');
    res.redirect('/admin/deliveries');
  }
};

// exports.updateDelivery = async (req, res) => {
//   try {
//     const { deliveryId } = req.params;
//     const {
//       driverId: inputDriverId,
//       scheduledPickupTime,
//       scheduledDeliveryTime,
//       instructions,
//       waypoints,
//       routeDistance,
//       routeDuration
//     } = req.body;

//     console.log('[UPDATE-DEBUG] Input driverId:', inputDriverId);
//     console.log('[UPDATE-DEBUG] Input driverId type:', typeof inputDriverId);
//     console.log('[UPDATE-DEBUG] Request body:', req.body);

//     // ═══════════════════════════════════════════════
//     // CRITICAL FIX: Handle [object Object] from form
//     // ═══════════════════════════════════════════════
//     let cleanDriverId = null;

//     if (inputDriverId) {
//       // If it's literally the string "[object Object]", it's invalid
//       if (inputDriverId === '[object Object]' || inputDriverId.includes('[object')) {
//         console.error('[UPDATE-ERROR] Invalid driverId format from form:', inputDriverId);
//         req.flash('error', 'Invalid driver selection. Please try again.');
//         return res.redirect(`/admin/deliveries/${deliveryId}/edit`);
//       }

//       // Try to extract valid ObjectId
//       try {
//         // If it's already a string ObjectId, use it
//         if (typeof inputDriverId === 'string' && inputDriverId.length === 24) {
//           cleanDriverId = inputDriverId;
//         }
//         // If it's an object with _id property
//         else if (typeof inputDriverId === 'object' && inputDriverId._id) {
//           cleanDriverId = inputDriverId._id.toString();
//         }
//         // If it's already an ObjectId instance
//         else if (inputDriverId.toString && inputDriverId.toString().length === 24) {
//           cleanDriverId = inputDriverId.toString();
//         }
//         else {
//           throw new Error('Cannot extract valid driver ID');
//         }
//       } catch (parseErr) {
//         console.error('[UPDATE-ERROR] Failed to parse driverId:', parseErr.message);
//         req.flash('error', 'Invalid driver ID format. Please select a driver from the dropdown.');
//         return res.redirect(`/admin/deliveries/${deliveryId}/edit`);
//       }
//     }

//     console.log('[UPDATE-DEBUG] Cleaned driverId:', cleanDriverId);

//     // Fetch delivery WITHOUT .lean() so we can save it later
//     const delivery = await Delivery.findById(deliveryId);
//     if (!delivery) {
//       req.flash('error', 'Delivery not found');
//       return res.redirect('/admin/deliveries');
//     }

//     // Convert current driver ID to string for comparison
//     const currentDriverIdStr = delivery.driverId ? delivery.driverId.toString() : null;
//     console.log('[UPDATE-DEBUG] Current driverId (string):', currentDriverIdStr);

//     // Parse waypoints
//     let parsedWaypoints = [];
//     if (waypoints) {
//       try {
//         parsedWaypoints = JSON.parse(waypoints);
//       } catch (e) {
//         console.warn('Invalid waypoints JSON:', e.message);
//       }
//     }

//     // Update non-driver fields
//     if (scheduledPickupTime) {
//       delivery.scheduledPickupTime = new Date(scheduledPickupTime);
//     }
//     if (scheduledDeliveryTime) {
//       delivery.scheduledDeliveryTime = new Date(scheduledDeliveryTime);
//     }
//     if (instructions) {
//       delivery.instructions = instructions;
//     }
//     if (parsedWaypoints.length > 0) {
//       delivery.waypoints = parsedWaypoints;
//     }
//     if (routeDistance) {
//       delivery.distance = parseFloat(routeDistance) || delivery.distance;
//     }
//     if (routeDuration) {
//       delivery.estimatedDuration = parseInt(routeDuration) || delivery.estimatedDuration;
//     }

//     // Handle driver change
//     let driverChanged = false;
//     let oldDriver = null;
//     let newDriver = null;
//     const newDriverIdStr = inputDriverId ? inputDriverId.toString() : null;

//     console.log('[UPDATE-DEBUG] Comparing drivers:', {
//       current: currentDriverIdStr,
//       new: newDriverIdStr,
//       same: newDriverIdStr === currentDriverIdStr
//     });

//     if (newDriverIdStr && newDriverIdStr !== currentDriverIdStr) {
//       console.log('[UPDATE-DEBUG] Driver change detected');

//       // Validate new driver
//       newDriver = await Driver.findById(newDriverIdStr);
//       if (!newDriver) {
//         req.flash('error', 'Selected driver not found');
//         return res.redirect(`/admin/deliveries/${deliveryId}/edit`);
//       }

//       if (!newDriver.isAvailable || newDriver.profileStatus !== 'approved') {
//         req.flash('error', 'Selected driver is not available or not approved');
//         return res.redirect(`/admin/deliveries/${deliveryId}/edit`);
//       }

//       // Free old driver
//       if (currentDriverIdStr) {
//         oldDriver = await Driver.findById(currentDriverIdStr);
//         if (oldDriver) {
//           oldDriver.isAvailable = true;
//           await oldDriver.save();
//           console.log(`[UPDATE] Freed old driver: ${oldDriver.name}`);
//         }
//       }

//       // Update delivery with new driver
//       delivery.driverId = newDriver._id;
//       delivery.vehicleNumber = newDriver.vehicleNumber;

//       // Mark new driver unavailable
//       newDriver.isAvailable = false;
//       await newDriver.save();

//       driverChanged = true;
//       console.log(`[UPDATE] Reassigned to new driver: ${newDriver.name}`);
//     }

//     // Save delivery
//     await delivery.save();
//     console.log('[UPDATE-DEBUG] Delivery saved successfully');

//     // Create status history
//     await DeliveryStatusHistory.create({
//       deliveryId: delivery._id,
//       status: delivery.status,
//       remarks: driverChanged
//         ? `Delivery reassigned from ${oldDriver?.name || 'previous driver'} to ${newDriver?.name}`
//         : 'Delivery details updated (route/schedule)',
//       updatedBy: {
//         userId: req.user._id,
//         userRole: req.user.role,
//         userName: req.user.name
//       }
//     });

//     // ────────────────────────────────────────────────
//     // NOTIFICATIONS
//     // ────────────────────────────────────────────────
//     console.log('[UPDATE-DEBUG] Starting notifications...');

//     if (driverChanged) {
//       console.log('[UPDATE-NOTIF] Driver changed - sending notifications');

//       // Notify OLD driver (if exists)
//       if (oldDriver) {
//         console.log(`[UPDATE-NOTIF] Notifying old driver: ${oldDriver.name}`);

//         // Push notification
//         if (oldDriver.fcmToken?.trim()) {
//           try {
//             await sendNotification(
//               oldDriver.name || "Driver",
//               "english",
//               oldDriver.fcmToken,
//               "delivery_cancelled",
//               {
//                 deliveryId: delivery._id.toString(),
//                 trackingNumber: delivery.trackingNumber,
//                 reason: "Reassigned to another driver",
//                 type: "delivery_cancelled"
//               }
//             );
//             console.log(`[UPDATE-NOTIF] FCM sent to old driver`);
//           } catch (pushErr) {
//             console.error("[UPDATE-NOTIF-ERROR] Old driver FCM failed:", pushErr.message);
//           }
//         }

//         // In-app notification
//         try {
//           await Notification.create({
//             userId: oldDriver._id,
//             type: 'delivery_cancelled',
//             title: 'Delivery Reassigned',
//             message: `Delivery ${delivery.trackingNumber} has been reassigned to another driver.`,
//             referenceId: delivery._id,
//             referenceModel: 'Delivery',
//             priority: 'high',
//             createdAt: new Date()
//           });
//           console.log(`[UPDATE-NOTIF] In-app notification created for old driver`);
//         } catch (notifErr) {
//           console.error("[UPDATE-NOTIF-ERROR] Old driver in-app failed:", notifErr.message);
//         }
//       }

//       // Notify NEW driver
//       if (newDriver) {
//         console.log(`[UPDATE-NOTIF] Notifying new driver: ${newDriver.name}`);

//         // Push notification
//         if (newDriver.fcmToken?.trim()) {
//           try {
//             await sendNotification(
//               newDriver.name || "Driver",
//               "english",
//               newDriver.fcmToken,
//               "delivery_assigned",
//               {
//                 deliveryId: delivery._id.toString(),
//                 trackingNumber: delivery.trackingNumber,
//                 customerName: delivery.customerId?.name || "Customer",
//                 pickup: delivery.pickupLocation?.address || "",
//                 type: "delivery_assigned"
//               }
//             );
//             console.log(`[UPDATE-NOTIF] FCM sent to new driver`);
//           } catch (pushErr) {
//             console.error("[UPDATE-NOTIF-ERROR] New driver FCM failed:", pushErr.message);
//           }
//         }

//         // In-app notification
//         try {
//           await Notification.create({
//             userId: newDriver._id,
//             type: 'delivery_assigned',
//             title: 'New Delivery Assigned',
//             message: `Delivery ${delivery.trackingNumber} has been assigned to you. Please check details in your app.`,
//             referenceId: delivery._id,
//             referenceModel: 'Delivery',
//             priority: 'high',
//             createdAt: new Date()
//           });
//           console.log(`[UPDATE-NOTIF] In-app notification created for new driver`);
//         } catch (notifErr) {
//           console.error("[UPDATE-NOTIF-ERROR] New driver in-app failed:", notifErr.message);
//         }
//       }

//     } else {
//       // Normal update - notify current driver
//       console.log('[UPDATE-NOTIF] Normal update - notifying current driver');

//       const currentDriver = await Driver.findById(delivery.driverId);
//       if (currentDriver) {
//         console.log(`[UPDATE-NOTIF] Current driver: ${currentDriver.name}`);

//         // Push notification
//         if (currentDriver.fcmToken?.trim()) {
//           try {
//             await sendNotification(
//               currentDriver.name || "Driver",
//               "english",
//               currentDriver.fcmToken,
//               "delivery_updated",
//               {
//                 deliveryId: delivery._id.toString(),
//                 trackingNumber: delivery.trackingNumber,
//                 type: "delivery_updated"
//               }
//             );
//             console.log(`[UPDATE-NOTIF] FCM sent to current driver`);
//           } catch (pushErr) {
//             console.error("[UPDATE-NOTIF-ERROR] Current driver FCM failed:", pushErr.message);
//           }
//         }

//         // In-app notification
//         try {
//           await Notification.create({
//             userId: currentDriver._id,
//             type: 'delivery_updated',
//             title: 'Delivery Updated',
//             message: `Delivery ${delivery.trackingNumber} has been updated. Please check details in your app.`,
//             referenceId: delivery._id,
//             referenceModel: 'Delivery',
//             priority: 'medium',
//             createdAt: new Date()
//           });
//           console.log(`[UPDATE-NOTIF] In-app notification created for current driver`);
//         } catch (notifErr) {
//           console.error("[UPDATE-NOTIF-ERROR] Current driver in-app failed:", notifErr.message);
//         }
//       } else {
//         console.warn('[UPDATE-NOTIF] No current driver found for notification');
//       }
//     }

//     console.log('[UPDATE-DEBUG] Update completed successfully');
//     req.flash('success', 'Delivery updated successfully!');
//     res.redirect(`/admin/deliveries/${delivery._id}`);

//   } catch (error) {
//     console.error('[UPDATE-DELIVERY] Error:', error);
//     console.error('[UPDATE-DELIVERY] Stack:', error.stack);
//     req.flash('error', error.message || 'Failed to update delivery');
//     res.redirect(`/admin/deliveries/${req.params.deliveryId}/edit`);
//   }
// };  



// ============= ADD DELIVERY REMARK =============

// ============= UPDATE DELIVERY =============

// ============= UPDATE DELIVERY =============
exports.updateDelivery = async (req, res) => {
  try {
    const { deliveryId } = req.params;
    const {
      driverId: inputDriverId,
      scheduledPickupTime,
      scheduledDeliveryTime,
      instructions,
      waypoints,
      routeDistance,
      routeDuration
    } = req.body;

    console.log('[UPDATE-DEBUG] Input driverId:', inputDriverId);
    console.log('[UPDATE-DEBUG] Input driverId type:', typeof inputDriverId);
    console.log('[UPDATE-DEBUG] Request body:', req.body);

    // ────────────────────────────────────────────────
    // Clean & Validate driverId (handle [object Object] case)
    // ────────────────────────────────────────────────
    let cleanDriverId = null;

    if (inputDriverId) {
      // Invalid case from bad form serialization
      if (String(inputDriverId).includes('[object') || String(inputDriverId) === '[object Object]') {
        console.error('[UPDATE-ERROR] Invalid driverId format from form:', inputDriverId);
        req.flash('error', 'Invalid driver selection. Please try again.');
        return res.redirect(`/admin/deliveries/${deliveryId}/edit`);
      }

      try {
        if (typeof inputDriverId === 'string' && inputDriverId.length === 24) {
          cleanDriverId = inputDriverId;
        } else if (typeof inputDriverId === 'object' && inputDriverId._id) {
          cleanDriverId = inputDriverId._id.toString();
        } else if (inputDriverId.toString && inputDriverId.toString().length === 24) {
          cleanDriverId = inputDriverId.toString();
        } else {
          throw new Error('Cannot extract valid driver ID');
        }
      } catch (parseErr) {
        console.error('[UPDATE-ERROR] Failed to parse driverId:', parseErr.message);
        req.flash('error', 'Invalid driver ID format. Please select a driver from the dropdown.');
        return res.redirect(`/admin/deliveries/${deliveryId}/edit`);
      }
    }

    console.log('[UPDATE-DEBUG] Cleaned driverId:', cleanDriverId);

    // Fetch delivery
    const delivery = await Delivery.findById(deliveryId);
    if (!delivery) {
      req.flash('error', 'Delivery not found');
      return res.redirect('/admin/deliveries');
    }

    const currentDriverIdStr = delivery.driverId ? delivery.driverId.toString() : null;
    console.log('[UPDATE-DEBUG] Current driverId (string):', currentDriverIdStr);

    // Parse waypoints
    let parsedWaypoints = [];
    if (waypoints) {
      try {
        parsedWaypoints = JSON.parse(waypoints);
      } catch (e) {
        console.warn('Invalid waypoints JSON:', e.message);
      }
    }

    // Update non-driver fields
    if (scheduledPickupTime) delivery.scheduledPickupTime = new Date(scheduledPickupTime);
    if (scheduledDeliveryTime) delivery.scheduledDeliveryTime = new Date(scheduledDeliveryTime);
    if (instructions) delivery.instructions = instructions;
    if (parsedWaypoints.length > 0) delivery.waypoints = parsedWaypoints;
    if (routeDistance) delivery.distance = parseFloat(routeDistance) || delivery.distance;
    if (routeDuration) delivery.estimatedDuration = parseInt(routeDuration) || delivery.estimatedDuration;

    // Handle driver change
    let driverChanged = false;
    let oldDriver = null;
    let newDriver = null;
    const newDriverIdStr = cleanDriverId;

    if (newDriverIdStr && newDriverIdStr !== currentDriverIdStr) {
      console.log('[UPDATE-DEBUG] Driver change detected');

      newDriver = await Driver.findById(newDriverIdStr);
      if (!newDriver) {
        req.flash('error', 'Selected driver not found');
        return res.redirect(`/admin/deliveries/${deliveryId}/edit`);
      }

      if (!newDriver.isAvailable || newDriver.profileStatus !== 'approved') {
        req.flash('error', 'Selected driver is not available or not approved');
        return res.redirect(`/admin/deliveries/${deliveryId}/edit`);
      }

      // Free old driver
      if (currentDriverIdStr) {
        oldDriver = await Driver.findById(currentDriverIdStr);
        if (oldDriver) {
          oldDriver.isAvailable = true;
          await oldDriver.save();
          console.log(`[UPDATE] Freed old driver: ${oldDriver.name}`);
        }
      }

      // Assign new driver
      delivery.driverId = newDriver._id;
      delivery.vehicleNumber = newDriver.vehicleNumber;
      newDriver.isAvailable = false;
      await newDriver.save();

      driverChanged = true;
      console.log(`[UPDATE] Reassigned to new driver: ${newDriver.name}`);
    }

    // Save updated delivery
    await delivery.save();
    console.log('[UPDATE-DEBUG] Delivery saved successfully');

    // Status history
    await DeliveryStatusHistory.create({
      deliveryId: delivery._id,
      status: delivery.status,
      remarks: driverChanged
        ? `Delivery reassigned from ${oldDriver?.name || 'previous driver'} to ${newDriver?.name}`
        : 'Delivery details updated (route/schedule/etc.)',
      updatedBy: {
        userId: req.user._id,
        userRole: req.user.role,
        userName: req.user.name
      }
    });

    // ────────────────────────────────────────────────
    // NOTIFICATIONS
    // ────────────────────────────────────────────────
    console.log('[UPDATE-NOTIF] Starting notifications...');

    if (driverChanged) {
      console.log('[UPDATE-NOTIF] Driver changed - notifying both old and new');

      // OLD DRIVER (cancel/reassign notification)
      if (oldDriver) {
        console.log(`[UPDATE-NOTIF] Notifying OLD driver: ${oldDriver.name}`);

        // Push notification
        if (oldDriver.fcmToken && oldDriver.fcmToken.trim().length > 20) {
          try {
            await sendNotification(
              oldDriver.name || "Driver",
              "english",
              oldDriver.fcmToken,
              "delivery_cancelled",
              {
                deliveryId: delivery._id.toString(),
                trackingNumber: delivery.trackingNumber,
                reason: "Reassigned to another driver",
                type: "delivery_cancelled"
              }
            );
            console.log(`[UPDATE-NOTIF] FCM sent to OLD driver`);
          } catch (e) {
            console.error("[UPDATE-FCM-OLD-ERROR]", e.message || e);
          }
        } else {
          console.warn("[UPDATE-NOTIF] No valid FCM token for OLD driver");
        }

        // In-app notification
        try {
          await Notification.create({
            recipientId: oldDriver._id,
            recipientType: 'Driver',
            type: 'delivery_cancelled',
            title: 'Delivery Reassigned',
            message: `Delivery ${delivery.trackingNumber} has been reassigned to another driver.`,
            referenceId: delivery._id,
            referenceModel: 'Delivery',
            priority: 'high',
            createdAt: new Date()
          });
          console.log(`[UPDATE-NOTIF] In-app sent to OLD driver`);
        } catch (e) {
          console.error("[UPDATE-INAPP-OLD-ERROR]", e.message || e);
        }
      }

      // NEW DRIVER (assigned notification)
      if (newDriver) {
        console.log(`[UPDATE-NOTIF] Notifying NEW driver: ${newDriver.name}`);

        // Push notification
        if (newDriver.fcmToken && newDriver.fcmToken.trim().length > 20) {
          try {
            await sendNotification(
              newDriver.name || "Driver",
              "english",
              newDriver.fcmToken,
              "delivery_assigned",
              {
                deliveryId: delivery._id.toString(),
                trackingNumber: delivery.trackingNumber,
                customerName: delivery.customerId?.name || "Customer",
                pickup: delivery.pickupLocation?.address || "",
                type: "delivery_assigned"
              }
            );
            console.log(`[UPDATE-NOTIF] FCM sent to NEW driver`);
          } catch (e) {
            console.error("[UPDATE-FCM-NEW-ERROR]", e.message || e);
          }
        } else {
          console.warn("[UPDATE-NOTIF] No valid FCM token for NEW driver");
        }

        // In-app notification
        try {
          await Notification.create({
            recipientId: newDriver._id,
            recipientType: 'Driver',
            type: 'delivery_assigned',
            title: 'New Delivery Assigned',
            message: `Delivery ${delivery.trackingNumber} has been assigned to you. Please check details in the app.`,
            referenceId: delivery._id,
            referenceModel: 'Delivery',
            priority: 'high',
            createdAt: new Date()
          });
          console.log(`[UPDATE-NOTIF] In-app sent to NEW driver`);
        } catch (e) {
          console.error("[UPDATE-INAPP-NEW-ERROR]", e.message || e);
        }
      }
    } else {
      // No driver change → notify current driver about update
      console.log('[UPDATE-NOTIF] No driver change - notifying current driver');

      const currentDriver = await Driver.findById(delivery.driverId);
      if (currentDriver) {
        console.log(`[UPDATE-NOTIF] Current driver: ${currentDriver.name}`);

        // Push notification
        if (currentDriver.fcmToken && currentDriver.fcmToken.trim().length > 20) {
          try {
            await sendNotification(
              currentDriver.name || "Driver",
              "english",
              currentDriver.fcmToken,
              "delivery_updated",
              {
                deliveryId: delivery._id.toString(),
                trackingNumber: delivery.trackingNumber,
                type: "delivery_updated"
              }
            );
            console.log(`[UPDATE-NOTIF] FCM update sent to current driver`);
          } catch (e) {
            console.error("[UPDATE-FCM-CURRENT-ERROR]", e.message || e);
          }
        } else {
          console.warn("[UPDATE-NOTIF] No valid FCM token for current driver");
        }

        // In-app notification
        try {
          await Notification.create({
            recipientId: currentDriver._id,
            recipientType: 'Driver',
            type: 'delivery_updated',
            title: 'Delivery Updated',
            message: `Delivery ${delivery.trackingNumber} details have been updated. Please check the app.`,
            referenceId: delivery._id,
            referenceModel: 'Delivery',
            priority: 'medium',
            createdAt: new Date()
          });
          console.log(`[UPDATE-NOTIF] In-app update created for current driver`);
        } catch (e) {
          console.error("[UPDATE-INAPP-CURRENT-ERROR]", e.message || e);
        }
      } else {
        console.warn("[UPDATE-NOTIF] No current driver found");
      }
    }

    console.log('[UPDATE-DEBUG] Update completed successfully');
    req.flash('success', 'Delivery updated successfully!');
    res.redirect(`/admin/deliveries/${delivery._id}`);

  } catch (error) {
    console.error('[UPDATE-DELIVERY] Error:', error);
    console.error('[UPDATE-DELIVERY] Stack:', error.stack);
    req.flash('error', error.message || 'Failed to update delivery');
    res.redirect(`/admin/deliveries/${req.params.deliveryId}/edit`);
  }
};


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
// Add these functions to the END of your deliveryAdminController.js
// (just before module.exports = exports;)

// ============= GET ALL DRIVER LOCATIONS FOR DASHBOARD =============
exports.getAllDriverLocations = async (req, res) => {
  try {
    // Find all active drivers with their current locations
    const drivers = await Driver.find({
      isActive: true,
      profileStatus: 'approved'
    })
      .select('name phone vehicleNumber profileImage isAvailable currentLocation')
      .lean();

    // Filter drivers who have valid location data
    const driversWithLocation = drivers.filter(driver =>
      driver.currentLocation &&
      driver.currentLocation.latitude &&
      driver.currentLocation.longitude
    );

    // Format response
    const formattedDrivers = driversWithLocation.map(driver => ({
      _id: driver._id,
      name: driver.name,
      phone: driver.phone,
      vehicleNumber: driver.vehicleNumber,
      profileImage: driver.profileImage,
      isAvailable: driver.isAvailable,
      currentLocation: {
        latitude: driver.currentLocation.latitude,
        longitude: driver.currentLocation.longitude,
        timestamp: driver.currentLocation.timestamp || new Date(),
        speed: driver.currentLocation.speed || 0,
        heading: driver.currentLocation.heading || 0
      }
    }));

    console.log(`[GET-ALL-DRIVER-LOCATIONS] Returning ${formattedDrivers.length} drivers with location`);

    return res.json({
      success: true,
      data: formattedDrivers,
      count: formattedDrivers.length
    });

  } catch (error) {
    console.error('[GET-ALL-DRIVER-LOCATIONS] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch driver locations',
      error: error.message
    });
  }
};

// ============= GET SINGLE DRIVER LOCATION =============
exports.getSingleDriverLocation = async (req, res) => {
  try {
    const { driverId } = req.params;

    const driver = await Driver.findById(driverId)
      .select('name phone vehicleNumber isAvailable currentLocation')
      .lean();

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }

    if (!driver.currentLocation || !driver.currentLocation.latitude) {
      return res.status(404).json({
        success: false,
        message: 'Driver location not available'
      });
    }

    return res.json({
      success: true,
      data: {
        _id: driver._id,
        name: driver.name,
        phone: driver.phone,
        vehicleNumber: driver.vehicleNumber,
        isAvailable: driver.isAvailable,
        currentLocation: driver.currentLocation
      }
    });

  } catch (error) {
    console.error('[GET-SINGLE-DRIVER-LOCATION] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch driver location',
      error: error.message
    });
  }
};

// ============= GET DRIVERS BY STATUS =============
exports.getDriversByStatus = async (req, res) => {
  try {
    const { status } = req.query; // 'available', 'busy', 'all'

    let query = {
      isActive: true,
      profileStatus: 'approved'
    };

    if (status === 'available') {
      query.isAvailable = true;
    } else if (status === 'busy') {
      query.isAvailable = false;
    }

    const drivers = await Driver.find(query)
      .select('name phone vehicleNumber profileImage isAvailable currentLocation')
      .lean();

    const driversWithLocation = drivers.filter(driver =>
      driver.currentLocation &&
      driver.currentLocation.latitude &&
      driver.currentLocation.longitude
    );

    console.log(`[GET-DRIVERS-BY-STATUS] Status: ${status || 'all'}, Found: ${driversWithLocation.length} drivers`);

    return res.json({
      success: true,
      data: driversWithLocation,
      count: driversWithLocation.length
    });

  } catch (error) {
    console.error('[GET-DRIVERS-BY-STATUS] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch drivers',
      error: error.message
    });
  }
};
