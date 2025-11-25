const Order = require('../../models/Order');
const OrderStatusHistory = require('../../models/OrderStatusHistory');
const Delivery = require('../../models/Delivery');
const User = require('../../models/User');
const { successResponse, errorResponse } = require('../../utils/responseHelper');


// Admin creates order
exports.createOrderByAdmin = async (req, res) => {
  try {
    const {
      customerId,
      items,
      deliveryLocation,
      pickupLocation,
      scheduledPickupDate,
      scheduledDeliveryDate,
      specialInstructions,
      packagingInstructions = '',
      priority = 'medium',
      status = 'pending'
    } = req.body;

    // 1. Customer check
    if (!customerId) return errorResponse(res, 'customerId is required', 400);

    const customer = await User.findById(customerId);
    if (!customer) return errorResponse(res, 'Customer not found', 404);

    // 2. Items validation 
    if (!items || !Array.isArray(items) || items.length === 0) {
      return errorResponse(res, 'At least one item is required', 400);
    }

    // 3. Process items — 
    const processedItems = items.map(item => ({
      productName: item.productName?.trim(),
      productCode: item.productCode || null,
      category: item.category || 'other',
      quantity: Number(item.quantity) || 1,
      description: item.description || '',
      specifications: item.specifications || {}
    }));

    // 4. Generate order number
    const orderNumber = await Order.generateOrderNumber();

    // 5. Pickup location
    const finalPickupLocation = pickupLocation && pickupLocation.address
      ? pickupLocation
      : {
        address: 'Orion Plastic Factory, Plot 45, GIDC Vatva, Ahmedabad',
        coordinates: { latitude: 22.9871, longitude: 72.6369 },
        contactPerson: 'Factory Manager',
        contactPhone: '9876543200'
      };

    // 6. Admin info (SAFE)
    const adminId = req.user?._id || null;
    const adminName = req.user?.name || 'System Admin';

    const order = await Order.create({
      orderNumber,
      customerId,
      orderType: 'retail',
      items: processedItems,
      pickupLocation: finalPickupLocation,
      deliveryLocation,
      scheduledPickupDate: scheduledPickupDate ? new Date(scheduledPickupDate) : null,
      scheduledDeliveryDate: scheduledDeliveryDate ? new Date(scheduledDeliveryDate) : null,
      specialInstructions: specialInstructions || '',
      packagingInstructions,
      priority,
      status,
      createdBy: adminId,
      confirmedBy: status === 'confirmed' ? adminId : null,
      confirmedAt: status === 'confirmed' ? new Date() : null
    });

    // 8. Status History
    await OrderStatusHistory.create({
      orderId: order._id,
      status: order.status,
      remarks: `Order created by ${adminName}`,
      updatedBy: {
        userId: adminId,
        userRole: 'admin',
        userName: adminName
      }
    });

    // 9. Populate customer
    await order.populate('customerId', 'name email phone companyName');

    return successResponse(res, 'Order created successfully!', { order }, 201);
    // res.redirect(`/admin/orders/${order._id}?success=Order created successfully`)

  } catch (error) {
    console.error('Create Order Error:', error.message);
    return errorResponse(res, error.message || 'Failed to create order', 500);
    // res.redirect('/admin/orders/create?error=Failed to create order');
  }
};

// Get all orders (Admin)
exports.getAllOrders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      customerId,
      search,
      orderType,
      priority,
      paymentStatus,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};

    // Filters
    if (status) query.status = status;
    if (customerId) query.customerId = customerId;
    if (orderType) query.orderType = orderType;
    if (priority) query.priority = priority;
    if (paymentStatus) query['paymentDetails.status'] = paymentStatus;

    // Search by order number or customer name
    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } }
      ];
    }

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('customerId', 'name email phone')
        .populate('deliveryId', 'trackingNumber status')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit)),
      Order.countDocuments(query)
    ]);

    return successResponse(res, 'Orders retrieved successfully', {
      orders,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Get All Orders Error:', error);
    return errorResponse(res, error.message || 'Failed to retrieve orders', 500);
  }
};

// Get single order details
exports.getOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId)
      .populate('customerId', 'name email phone')
      .populate('deliveryId')
      .populate('createdBy', 'name email')
      .populate('confirmedBy', 'name email');

    if (!order) {
      return errorResponse(res, 'Order not found', 404);
    }

    // Check authorization (customer can only see their own orders)
    if (req.user.role === 'customer' && order.customerId._id.toString() !== req.user._id.toString()) {
      return errorResponse(res, 'Access denied', 403);
    }

    // Get status history
    const statusHistory = await OrderStatusHistory.find({ orderId: order._id })
      .sort({ timestamp: 1 })
      .populate('updatedBy.userId', 'name email');

    return successResponse(res, 'Order details retrieved successfully', {
      order,
      statusHistory
    });

  } catch (error) {
    console.error('Get Order Details Error:', error);
    return errorResponse(res, error.message || 'Failed to retrieve order details', 500);
  }
};
// Render edit order page
exports.renderEditOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customerId', 'name email phone');

    if (!order) {
      return res.redirect('/admin/orders?error=Order not found');
    }

    const customers = await User.find({ role: 'customer' })
      .select('name email phone')
      .sort({ name: 1 });

    res.render('admin/orders/edit', {
      title: 'Edit Order',
      user: req.user,
      order,
      customers
    });
  } catch (error) {
    console.error('Render Edit Order Error:', error);
    res.redirect('/admin/orders?error=Failed to load edit order page');
  }
};
// Update order (Admin or Customer if pending)
exports.updateOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const updates = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return errorResponse(res, 'Order not found', 404);
    }

    // Check if order can be modified
    if (!order.canBeModified()) {
      return errorResponse(res, 'Order cannot be modified in current status', 400);
    }

    // Check authorization
    if (req.user.role === 'customer' && order.customerId.toString() !== req.user._id.toString()) {
      return errorResponse(res, 'Access denied', 403);
    }

    // Restricted fields for customers
    if (req.user.role === 'customer') {
      delete updates.status;
      delete updates.taxPercentage;
      delete updates.shippingCharges;
      delete updates.discount;
    }

    // Update order
    Object.assign(order, updates);
    await order.save();

    // return successResponse(res, 'Order updated successfully', { order });
    res.redirect(`/admin/orders/${order._id}?success=Order updated successfully`);

  } catch (error) {
    console.error('Update Order Error:', error);
    // return errorResponse(res, error.message || 'Failed to update order', 500);
    res.redirect(`/admin/orders/${req.params.id}/edit?error=Failed to update order`);

  }
};

// Confirm order (Admin)
exports.confirmOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { remarks, scheduledPickupDate, scheduledDeliveryDate } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return errorResponse(res, 'Order not found', 404);
    }

    if (order.status !== 'pending') {
      return errorResponse(res, 'Only pending orders can be confirmed', 400);
    }

    order.status = 'confirmed';
    order.confirmedBy = req.user._id;
    order.confirmedAt = new Date();

    if (scheduledPickupDate) order.scheduledPickupDate = scheduledPickupDate;
    if (scheduledDeliveryDate) order.scheduledDeliveryDate = scheduledDeliveryDate;

    await order.save();

    // Create status history
    await OrderStatusHistory.create({
      orderId: order._id,
      status: 'confirmed',
      previousStatus: 'pending',
      remarks: remarks || 'Order confirmed',
      updatedBy: {
        userId: req.user._id,
        userRole: req.user.role,
        userName: req.user.name
      }
    });

    await order.populate('customerId', 'name email phone');

    return successResponse(res, 'Order confirmed successfully', { order });

  } catch (error) {
    console.error('Confirm Order Error:', error);
    return errorResponse(res, error.message || 'Failed to confirm order', 500);
  }
};

// Update order status (Admin)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, remarks } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return errorResponse(res, 'Order not found', 404);
    }

    const previousStatus = order.status;
    order.status = status;  

    // Update specific fields based on status
    if (status === 'confirmed' && !order.confirmedBy) {
      order.confirmedBy = req.user._id;
      order.confirmedAt = new Date();
    }

    await order.save();

    // Create status history
    await OrderStatusHistory.create({
      orderId: order._id,
      status,
      previousStatus,
      remarks,
      updatedBy: {
        userId: req.user._id,
        userRole: req.user.role,
        userName: req.user.name
      }
    });

    return successResponse(res, 'Order status updated successfully', { order });

  } catch (error) {
    console.error('Update Order Status Error:', error);
    return errorResponse(res, error.message || 'Failed to update order status', 500);
  }
};

// List all orders
exports.listOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.status) query.status = req.query.status;
    if (req.query.search) {
      query.$or = [
        { orderNumber: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('customerId', 'name email phone')
        .populate('deliveryId', 'trackingNumber status')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Order.countDocuments(query)
    ]);

    res.render('admin/orders/list', {
      title: 'Orders',
      user: req.user,
      orders,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      filters: req.query,
      success: req.query.success,
      error: req.query.error
    });
  } catch (error) {
    console.error('List Orders Error:', error);
    res.redirect('/admin/dashboard?error=Failed to load orders');
  }
};

// Render create order page
exports.renderCreateOrder = async (req, res) => {
  try {
    const customers = await User.find({ role: 'customer' })
      .select('name email phone')
      .sort({ name: 1 });

    res.render('admin/orders/create', {
      title: 'Create Order',
      user: req.user,
      customers
    });
  } catch (error) {
    console.error('Render Create Order Error:', error);
    res.redirect('/admin/orders?error=Failed to load create order page');
  }
};

// View order details
exports.viewOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customerId', 'name email phone')
      .populate('deliveryId')
      .populate('createdBy', 'name email')
      .populate('confirmedBy', 'name email');

    if (!order) {
      return res.redirect('/admin/orders?error=Order not found');
    }

    const statusHistory = await OrderStatusHistory.find({ orderId: order._id })
      .sort({ timestamp: 1 })
      .populate('updatedBy.userId', 'name email');

    res.render('admin/orders/details', {
      title: `Order ${order.orderNumber}`,
      user: req.user,
      order,
      statusHistory,
      success: req.query.success,
      error: req.query.error
    });
  } catch (error) {
    console.error('View Order Error:', error);
    res.redirect('/admin/orders?error=Failed to load order details');
  }
};
module.exports = exports;