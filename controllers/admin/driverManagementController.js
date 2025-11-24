const Driver = require('../../models/Driver');
const Vehicle = require('../../models/Vehicle');
const Delivery = require('../../models/Delivery');
const { successResponse, errorResponse } = require('../../utils/responseHelper');

//BLOCK DRIVER
exports.blockDriver = async (req, res) => {
  try {
    const { driverId } = req.params;

    if (!req.body || Object.keys(req.body).length === 0) {
      return errorResponse(res, 'Request body is missing or empty', 400);
    }

    const { reason, blockType, unblockDate } = req.body;

    if (!reason || reason.trim() === '') {
      return errorResponse(res, 'Block reason is required', 400);
    }

    const driver = await Driver.findById(driverId);

    if (!driver) {
      return errorResponse(res, 'Driver not found', 404);
    }

    if (driver.blockStatus?.isBlocked) {
      return errorResponse(res, 'Driver is already blocked', 400);
    }

    // Block driver
    driver.blockStatus = driver.blockStatus || {};
    driver.blockStatus.isBlocked = true;
    driver.blockStatus.blockedAt = new Date();
    driver.blockStatus.blockedBy = req.user._id;
    driver.blockStatus.blockReason = reason.trim();
    driver.blockStatus.blockType = blockType || 'temporary';
    
    if (blockType === 'temporary' && unblockDate) {
      driver.blockStatus.unblockDate = new Date(unblockDate);
    }

    driver.isAvailable = false;
    driver.isActive = false;

    await driver.save();

    return successResponse(res, 'Driver blocked successfully', {
      driver: {
        id: driver._id,
        name: driver.name,
        phone: driver.phone,
        blockStatus: driver.blockStatus
      }
    });

  } catch (error) {
    console.error('Block Driver Error:', error);
    return errorResponse(res, 'Failed to block driver', 500);
  }
};

//UNBLOCK DRIVER
exports.unblockDriver = async (req, res) => {
  try {
    const { driverId } = req.params;

    if (!req.body || Object.keys(req.body).length === 0) {
      return errorResponse(res, 'Request body is missing', 400);
    }

    const { notes } = req.body;  

    const driver = await Driver.findById(driverId);

    if (!driver) {
      return errorResponse(res, 'Driver not found', 404);
    }

    if (!driver.blockStatus?.isBlocked) {
      return errorResponse(res, 'Driver is not currently blocked', 400);
    }

    // Unblock driver
    driver.blockStatus.isBlocked = false;
    driver.blockStatus.blockedAt = null;
    driver.blockStatus.blockedBy = null;
    driver.blockStatus.blockReason = null;
    driver.blockStatus.blockType = null;
    driver.blockStatus.unblockDate = null;
    
    driver.isActive = true;
    driver.isAvailable = true; 

    if (notes && notes.trim()) {
      driver.notes = notes.trim();
    }

    await driver.save();

    return successResponse(res, 'Driver unblocked successfully', {
      driver: {
        id: driver._id,
        name: driver.name,
        phone: driver.phone,
        email: driver.email,
        isActive: driver.isActive,
        blockStatus: driver.blockStatus
      }
    });

  } catch (error) {
    console.error('Unblock Driver Error:', error);
    return errorResponse(res, 'Failed to unblock driver', 500);
  }
};

// UPDATE DRIVER DETAILS
exports.updateDriverDetails = async (req, res) => {
  try {
    const { driverId } = req.params;
    const updates = req.body;

    // Remove sensitive fields
    delete updates.password;
    delete updates.pin;
    delete updates.role;
    delete updates.blockStatus;
    delete updates.performance;

    const driver = await Driver.findByIdAndUpdate(
      driverId,
      updates,
      { new: true, runValidators: true }
    ).select('-password -pin');

    if (!driver) {
      return errorResponse(res, 'Driver not found', 404);
    }

    return successResponse(res, 'Driver details updated successfully', {
      driver
    });

  } catch (error) {
    console.error('Update Driver Details Error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return errorResponse(res, messages.join(', '), 400);
    }
    return errorResponse(res, 'Failed to update driver details', 500);
  }
};

// UPDATE BANK DETAILS
exports.updateBankDetails = async (req, res) => {
  try {
    const { driverId } = req.params;
    const { accountHolderName, accountNumber, ifscCode, bankName, branch, accountType } = req.body;

    const driver = await Driver.findById(driverId);

    if (!driver) {
      return errorResponse(res, 'Driver not found', 404);
    }

    driver.bankDetails = {
      accountHolderName,
      accountNumber,
      ifscCode,
      bankName,
      branch,
      accountType
    };

    await driver.save();

    return successResponse(res, 'Bank details updated successfully', {
      driver: {
        id: driver._id,
        name: driver.name,
        bankDetails: driver.bankDetails
      }
    });

  } catch (error) {
    console.error('Update Bank Details Error:', error);
    return errorResponse(res, 'Failed to update bank details', 500);
  }
};

//GET DRIVER PERFORMANCE

exports.getDriverPerformance = async (req, res) => {
  try {
    const { driverId } = req.params;
    const { startDate, endDate } = req.query;

    const driver = await Driver.findById(driverId)
      .select('name email phone performance');

    if (!driver) {
      return errorResponse(res, 'Driver not found', 404);
    }

    // Get delivery statistics for date range
    let dateFilter = { driverId: driver._id };
    
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    const deliveryStats = await Delivery.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          totalDeliveries: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] }
          },
          cancelled: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
          },
          onTime: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$status', 'delivered'] },
                    { $lte: ['$actualDeliveryTime', '$scheduledDeliveryTime'] }
                  ]
                },
                1,
                0
              ]
            }
          },
          totalDistance: { $sum: '$distance' }
        }
      }
    ]);

    const stats = deliveryStats[0] || {
      totalDeliveries: 0,
      completed: 0,
      cancelled: 0,
      onTime: 0,
      totalDistance: 0
    };

    const onTimeRate = stats.completed > 0 
      ? ((stats.onTime / stats.completed) * 100).toFixed(2)
      : 0;

    return successResponse(res, 'Driver performance retrieved successfully', {
      driver: {
        id: driver._id,
        name: driver.name,
        email: driver.email,
        phone: driver.phone
      },
      performance: {
        ...driver.performance.toObject(),
        periodStats: {
          totalDeliveries: stats.totalDeliveries,
          completedDeliveries: stats.completed,
          cancelledDeliveries: stats.cancelled,
          onTimeDeliveries: stats.onTime,
          onTimeDeliveryRate: parseFloat(onTimeRate),
          totalDistance: stats.totalDistance
        }
      }
    });

  } catch (error) {
    console.error('Get Driver Performance Error:', error);
    return errorResponse(res, 'Failed to retrieve driver performance', 500);
  }
};

//  GET ALL DRIVERS (WITH FILTERS)
exports.getAllDrivers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      profileStatus,
      isBlocked,
      vehicleType,
      isAvailable,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};

    // Filters
    if (status === 'active') query.isActive = true;
    if (status === 'inactive') query.isActive = false;
    if (profileStatus) query.profileStatus = profileStatus;
    if (isBlocked === 'true') query['blockStatus.isBlocked'] = true;
    if (isBlocked === 'false') query['blockStatus.isBlocked'] = false;
    if (vehicleType) query.vehicleType = vehicleType;
    if (isAvailable === 'true') query.isAvailable = true;
    if (isAvailable === 'false') query.isAvailable = false;

    // Search
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { licenseNumber: { $regex: search, $options: 'i' } },
        { vehicleNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const [drivers, total] = await Promise.all([
      Driver.find(query)
        .select('-password -pin -resetPinToken -resetPinExpires')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit)),
      Driver.countDocuments(query)
    ]);

    return successResponse(res, 'Drivers retrieved successfully', {
      drivers,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Get All Drivers Error:', error);
    return errorResponse(res, 'Failed to retrieve drivers', 500);
  }
};

exports.getDriverDetails = async (req, res) => {
  try {
    const driverId = req.params.driverId || req.params.id;

    if (!driverId) {
      return errorResponse(res, 'Driver ID is required', 400);
    }

    // Validate MongoDB ObjectId
    if (!driverId.match(/^[0-9a-fA-F]{24}$/)) {
      return errorResponse(res, 'Invalid Driver ID format', 400);
    }

    const driver = await Driver.findById(driverId)
      .select(`
        name email phone alternatePhone address aadhaarNumber licenseNumber
        licenseExpiry bloodGroup dateOfBirth joiningDate status isActive
        emergencyContact profileImage currentLocation
        totalTrips completedTrips cancelledTrips rating averageRating
        totalEarnings walletBalance bankDetails documents createdAt updatedAt
      `)
      .lean();

    if (!driver) {
      return errorResponse(res, 'Driver not found', 404);
    }

    // Assigned vehicle
    const assignedVehicle = await Vehicle.findOne({ assignedDriver: driverId })
      .select('vehicleNumber registrationNumber vehicleType currentMeterReading status')
      .lean();

    driver.assignedVehicle = assignedVehicle || null;

    return successResponse(res, 'Driver details fetched successfully', driver);

  } catch (error) {
    console.error('Get driver details error:', error);
    return errorResponse(res, 'Server error', 500);
  }
};

// GET DRIVER STATISTICS 
exports.getDriverStatistics = async (req, res) => {
  try {
    const [
      totalDrivers,
      activeDrivers,
      availableDrivers,
      blockedDrivers,
      pendingApproval,
      approvedDrivers,
      driversByVehicleType,
      topPerformers
    ] = await Promise.all([
      Driver.countDocuments(),
      Driver.countDocuments({ isActive: true }),
      Driver.countDocuments({ isAvailable: true, profileStatus: 'approved' }),
      Driver.countDocuments({ 'blockStatus.isBlocked': true }),
      Driver.countDocuments({ profileStatus: 'pending_verification' }),
      Driver.countDocuments({ profileStatus: 'approved' }),
      Driver.aggregate([
        { $match: { vehicleType: { $ne: null } } },
        { $group: { _id: '$vehicleType', count: { $sum: 1 } } }
      ]),
      Driver.find({ profileStatus: 'approved' })
        .select('name email performance.averageRating performance.totalDeliveries')
        .sort({ 'performance.averageRating': -1, 'performance.totalDeliveries': -1 })
        .limit(10)
    ]);

    return successResponse(res, 'Driver statistics retrieved successfully', {
      totalDrivers,
      activeDrivers,
      availableDrivers,
      blockedDrivers,
      pendingApproval,
      approvedDrivers,
      driversByVehicleType,
      topPerformers
    });

  } catch (error) {
    console.error('Get Driver Statistics Error:', error);
    return errorResponse(res, 'Failed to retrieve driver statistics', 500);
  }
};

module.exports = exports;