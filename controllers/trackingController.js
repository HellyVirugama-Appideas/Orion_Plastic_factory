const TrackingLog = require('../models/TrackingLog');
const Delivery = require('../models/Delivery');
const Driver = require('../models/Driver');
const { successResponse, errorResponse } = require('../utils/responseHelper');
const { calculateDistance } = require('../utils/geoHelper');

// Update Real-time Location (Driver)
// exports.updateLocation = async (req, res) => {
//   try {
//     const { deliveryId, latitude, longitude, address, accuracy, speed, heading, batteryLevel } = req.body;

//     // Validate required fields
//     if (!deliveryId || !latitude || !longitude) {
//       return errorResponse(res, 'Delivery ID, latitude, and longitude are required', 400);
//     }

//     // Validate coordinates
//     if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
//       return errorResponse(res, 'Invalid coordinates', 400);
//     }

//     // Get driver
//     const driver = await Driver.findOne({ userId: req.user._id });
//     if (!driver) {
//       return errorResponse(res, 'Driver profile not found', 404);
//     }

//     // Verify delivery belongs to driver
//     const delivery = await Delivery.findOne({
//       _id: deliveryId,
//       driverId: driver._id
//     });

//     if (!delivery) {
//       return errorResponse(res, 'Delivery not found or not assigned to you', 404);
//     }

//     // Create tracking log
//     const trackingLog = await TrackingLog.create({
//       deliveryId,
//       driverId: driver._id,
//       location: {
//         coordinates: { latitude, longitude },
//         address: address || '',
//         accuracy: accuracy || null
//       },
//       speed: speed || null,
//       heading: heading || null,
//       batteryLevel: batteryLevel || null
//     });

//     // Update delivery's estimated time if status is in_transit
//     if (delivery.status === 'in_transit' || delivery.status === 'out_for_delivery') {
//       const distance = calculateDistance(
//         latitude,
//         longitude,
//         delivery.deliveryLocation.coordinates.latitude,
//         delivery.deliveryLocation.coordinates.longitude
//       );

//       // Update distance and estimate (assuming average speed of 40 km/h)
//       delivery.distance = distance;
//       const estimatedMinutes = (distance / 40) * 60; // Convert to minutes
//       delivery.estimatedDeliveryTime = new Date(Date.now() + estimatedMinutes * 60000);
//       await delivery.save();
//     }

//     return successResponse(res, 'Location updated successfully', {
//       trackingLog: {
//         id: trackingLog._id,
//         timestamp: trackingLog.timestamp,
//         location: trackingLog.location
//       }
//     });

//   } catch (error) {
//     console.error('Update Location Error:', error);
//     return errorResponse(res, error.message || 'Failed to update location', 500);
//   }
// };

exports.updateLocation = async (req, res) => {
  try {
    const {
      deliveryId,
      latitude,
      longitude,
      address,
      accuracy,
      speed,
      heading,
      batteryLevel
    } = req.body;

    // 1. Required fields
    if (!deliveryId || latitude === undefined || longitude === undefined) {
      return errorResponse(res, 'deliveryId, latitude and longitude are required', 400);
    }

    // 2. Validate coordinates
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return errorResponse(res, 'Invalid latitude or longitude values', 400);
    }

    const driver = req.user; 

    if (!driver || !driver._id) {
      return errorResponse(res, 'Driver not authenticated', 401);
    }

    const delivery = await Delivery.findOne({
      _id: deliveryId,
      driverId: driver._id,       
      status: { $in: ['assigned', 'picked_up', 'in_transit', 'out_for_delivery'] }
    });

    if (!delivery) {
      return errorResponse(res, 'Delivery not found or not assigned to you', 404);
    }

    // 4. Create tracking log
    const trackingLog = await TrackingLog.create({
      deliveryId,
      driverId: driver._id,
      location: {
        coordinates: { latitude: Number(latitude), longitude: Number(longitude) },
        address: address || 'GPS Location',
        accuracy: accuracy ? Number(accuracy) : null
      },
      speed: speed ? Number(speed) : null,
      heading: heading ? Number(heading) : null,
      batteryLevel: batteryLevel ? Number(batteryLevel) : null
    });

    // 5. Update delivery ETA (only if in transit)
    if (['in_transit', 'out_for_delivery'].includes(delivery.status)) {
      const destLat = delivery.deliveryLocation.coordinates.latitude;
      const destLng = delivery.deliveryLocation.coordinates.longitude;

      if (destLat && destLng) {
        const distance = calculateDistance(latitude, longitude, destLat, destLng);
        const avgSpeed = 35; // km/h (realistic for city)
        const minutes = Math.round((distance / avgSpeed) * 60);

        delivery.distance = parseFloat(distance.toFixed(2));
        delivery.estimatedDeliveryTime = new Date(Date.now() + minutes * 60000);
        await delivery.save();
      }
    }

    return successResponse(res, 'Location updated successfully!', {
      trackingId: trackingLog._id,
      timestamp: trackingLog.timestamp,
      coordinates: { latitude: Number(latitude), longitude: Number(longitude) },
      estimatedArrival: delivery.estimatedDeliveryTime || null
    });

  } catch (error) {
    console.error('Update Location Error:', error.message);
    return errorResponse(res, error.message || 'Failed to update location', 500);
  }
};
// Get Current Location of Vehicle/Driver
exports.getCurrentLocation = async (req, res) => {
  try {
    const { deliveryId } = req.params;

    const delivery = await Delivery.findById(deliveryId)
      .populate({
        path: 'driverId',
        populate: { path: 'userId', select: 'name phone profileImage' }
      });

    if (!delivery) {
      return errorResponse(res, 'Delivery not found', 404);
    }

    // Get latest tracking log
    const latestLocation = await TrackingLog.findOne({ deliveryId })
      .sort({ timestamp: -1 });

    if (!latestLocation) {
      return errorResponse(res, 'No location data available yet', 404);
    }

    return successResponse(res, 'Current location retrieved successfully', {
      delivery: {
        id: delivery._id,
        trackingNumber: delivery.trackingNumber,
        status: delivery.status,
        estimatedDeliveryTime: delivery.estimatedDeliveryTime
      },
      driver: delivery.driverId ? {
        name: delivery.driverId.userId.name,
        phone: delivery.driverId.userId.phone,
        profileImage: delivery.driverId.userId.profileImage,
        vehicleNumber: delivery.vehicleNumber
      } : null,
      currentLocation: latestLocation
    });

  } catch (error) {
    console.error('Get Current Location Error:', error);
    return errorResponse(res, 'Failed to retrieve current location', 500);
  }
};

// Track Delivery Progress
// controllers/trackingController.js → YE PURA FUNCTION REPLACE KAR DO

exports.trackDeliveryProgress = async (req, res) => {
  try {
    const { deliveryId } = req.params;

    // 1. Delivery fetch karo (driverId populate karo — sirf Driver model)
    const delivery = await Delivery.findById(deliveryId)
      .populate('driverId', 'name phone vehicleNumber vehicleType isAvailable'); // ← YE SAHI HAI!

    if (!delivery) {
      return errorResponse(res, 'Delivery not found', 404);
    }

    // 2. Tracking logs
    const trackingLogs = await TrackingLog.find({ deliveryId })
      .sort({ timestamp: 1 })
      .select('location.coordinates location.address timestamp speed batteryLevel');

    // 3. Total distance traveled
    let totalDistance = 0;
    for (let i = 1; i < trackingLogs.length; i++) {
      const prev = trackingLogs[i - 1].location.coordinates;
      const curr = trackingLogs[i].location.coordinates;
      totalDistance += calculateDistance(
        prev.latitude,
        prev.longitude,
        curr.latitude,
        curr.longitude
      );
    }

    // 4. Latest location
    const latestLocation = trackingLogs[trackingLogs.length - 1] || null;

    // 5. Remaining distance
    let remainingDistance = 0;
    if (latestLocation && delivery.deliveryLocation?.coordinates) {
      remainingDistance = calculateDistance(
        latestLocation.location.coordinates.latitude,
        latestLocation.location.coordinates.longitude,
        delivery.deliveryLocation.coordinates.latitude,
        delivery.deliveryLocation.coordinates.longitude
      );
    }

    const totalEstimated = totalDistance + remainingDistance;
    const completionPercentage = totalEstimated > 0 
      ? Math.round((totalDistance / totalEstimated) * 100)
      : 0;

    // 6. Driver info (safe fallback)
    const driverInfo = delivery.driverId ? {
      id: delivery.driverId._id,
      name: delivery.driverId.name || 'Driver',
      phone: delivery.driverId.phone || 'N/A',
      vehicleNumber: delivery.driverId.vehicleNumber || 'N/A',
      vehicleType: delivery.driverId.vehicleType || 'Unknown'
    } : null;

    // 7. Final Response
    return successResponse(res, 'Delivery progress retrieved successfully!', {
      delivery: {
        id: delivery._id,
        trackingNumber: delivery.trackingNumber,
        status: delivery.status,
        scheduledDeliveryTime: delivery.scheduledDeliveryTime,
        estimatedDeliveryTime: delivery.estimatedDeliveryTime || null,
        driver: driverInfo
      },
      progress: {
        totalDistanceTraveled: parseFloat(totalDistance.toFixed(2)),
        remainingDistance: parseFloat(remainingDistance.toFixed(2)),
        completionPercentage,
        totalTrackingPoints: trackingLogs.length
      },
      currentLocation: latestLocation ? {
        latitude: latestLocation.location.coordinates.latitude,
        longitude: latestLocation.location.coordinates.longitude,
        address: latestLocation.location.address || 'GPS Location',
        timestamp: latestLocation.timestamp
      } : null,
      route: trackingLogs.map(log => ({
        latitude: log.location.coordinates.latitude,
        longitude: log.location.coordinates.longitude,
        timestamp: log.timestamp
      }))
    });

  } catch (error) {
    console.error('Track Delivery Progress Error:', error.message);
    return errorResponse(res, 'Failed to track delivery progress', 500);
  }
};

// Get Route Recording (All tracking logs with timestamps)
exports.getRouteRecording = async (req, res) => {
  try {
    const { deliveryId } = req.params;

    const delivery = await Delivery.findById(deliveryId);
    if (!delivery) {
      return errorResponse(res, 'Delivery not found', 404);
    }

    // Get all tracking logs
    const trackingLogs = await TrackingLog.find({ deliveryId })
      .sort({ timestamp: 1 })
      .select('location speed heading timestamp');

    if (trackingLogs.length === 0) {
      return errorResponse(res, 'No route data available', 404);
    }

    // Format for map display
    const route = trackingLogs.map(log => ({
      latitude: log.location.coordinates.latitude,
      longitude: log.location.coordinates.longitude,
      speed: log.speed,
      heading: log.heading,
      timestamp: log.timestamp
    }));

    return successResponse(res, 'Route recording retrieved successfully', {
      delivery: {
        id: delivery._id,
        trackingNumber: delivery.trackingNumber,
        status: delivery.status
      },
      route,
      routePoints: route.length,
      startTime: trackingLogs[0].timestamp,
      lastUpdate: trackingLogs[trackingLogs.length - 1].timestamp
    });

  } catch (error) {
    console.error('Get Route Recording Error:', error);
    return errorResponse(res, 'Failed to retrieve route recording', 500);
  }
};

// Get Tracking History (Admin/Customer view)
exports.getTrackingHistory = async (req, res) => {
  try {
    const { deliveryId } = req.params;
    const { startDate, endDate } = req.query;

    const delivery = await Delivery.findById(deliveryId);
    if (!delivery) {
      return errorResponse(res, 'Delivery not found', 404);
    }

    // Build query
    const query = { deliveryId };
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const trackingLogs = await TrackingLog.find(query)
      .sort({ timestamp: -1 })
      .limit(1000); // Limit to last 1000 records

    return successResponse(res, 'Tracking history retrieved successfully', {
      delivery: {
        id: delivery._id,
        trackingNumber: delivery.trackingNumber
      },
      history: trackingLogs,
      totalRecords: trackingLogs.length
    });

  } catch (error) {
    console.error('Get Tracking History Error:', error);
    return errorResponse(res, 'Failed to retrieve tracking history', 500);
  }
};

// Delete Old Tracking Logs (Admin - Cleanup)
exports.deleteOldTrackingLogs = async (req, res) => {
  try {
    const { days = 30 } = req.query;

    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const result = await TrackingLog.deleteMany({
      timestamp: { $lt: cutoffDate }
    });

    return successResponse(res, 'Old tracking logs deleted successfully', {
      deletedCount: result.deletedCount,
      cutoffDate
    });

  } catch (error) {
    console.error('Delete Old Tracking Logs Error:', error);
    return errorResponse(res, 'Failed to delete old tracking logs', 500);
  }
};