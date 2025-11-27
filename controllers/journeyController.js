const Journey = require('../models/Journey');
const Delivery = require('../models/Delivery');
const Driver = require('../models/Driver');
const DeliveryStatusHistory = require('../models/DeliveryStatusHistory');
const { successResponse, errorResponse } = require('../utils/responseHelper');
const { calculateDistance } = require('../utils/geoHelper');
const path = require('path');
const fs = require('fs');

// Start Journey
exports.startJourney = async (req, res) => {
  try {
    const { deliveryId, latitude, longitude, address } = req.body;

    if (!deliveryId || latitude === undefined || longitude === undefined) {
      return errorResponse(res, 'deliveryId, latitude and longitude are required', 400);
    }

    const driver = req.user;

    if (!driver) {
      return errorResponse(res, 'Driver not authenticated', 401);
    }

    // Verify delivery assigned to this driver
    const delivery = await Delivery.findOne({
      _id: deliveryId,
      driverId: driver._id,    
      status: 'assigned'
    });

    if (!delivery) {
      return errorResponse(res, 'Delivery not found or not assigned to you', 404);
    }

    // Check if journey already exists
    const existingJourney = await Journey.findOne({
      deliveryId,
      status: { $in: ['started', 'in_progress'] }
    });

    if (existingJourney) {
      return errorResponse(res, 'Journey already started', 400);
    }

    // Create Journey
    const journey = await Journey.create({
      deliveryId,
      driverId: driver._id,
      startLocation: {
        coordinates: { latitude: Number(latitude), longitude: Number(longitude) },
        address: address || 'Location captured via GPS'
      },
      startTime: new Date(),
      status: 'started'
    });

    // Update Delivery Status
    delivery.status = 'picked_up';
    delivery.actualPickupTime = new Date();
    await delivery.save();

    // Delivery Status History
    await DeliveryStatusHistory.create({
      deliveryId: delivery._id,
      status: 'picked_up',
      location: {
        coordinates: { latitude: Number(latitude), longitude: Number(longitude) },
        address: address || 'GPS Location'
      },
      remarks: 'Driver started journey',
      updatedBy: {
        userId: driver._id,
        userRole: 'driver',
        userName: driver.name
      }
    });

    return successResponse(res, 'Journey started successfully!', {
      journey,
      deliveryStatus: delivery.status
    }, 201);

  } catch (error) {
    console.error('Start Journey Error:', error.message);
    return errorResponse(res, error.message || 'Failed to start journey', 500);
  }
};

// End Journey
// exports.endJourney = async (req, res) => {
//   try {
//     const { journeyId } = req.params;
//     const { latitude, longitude, address, finalRemarks } = req.body;

//     // 1. Validate location
//     if (!latitude || !longitude) {
//       return errorResponse(res, 'End location (latitude & longitude) is required', 400);
//     }

//     // 2. Get journey
//     const journey = await Journey.findById(journeyId);
//     if (!journey) {
//       return errorResponse(res, 'Journey not found', 404);
//     }

//     // DRIVER ALREADY IN req.user (authenticateDriver)
//     const driver = req.user; 

//     // 3. Verify ownership
//     if (journey.driverId.toString() !== driver._id.toString()) {
//       return errorResponse(res, 'Unauthorized: This journey does not belong to you', 403);
//     }

//     // 4. Check if already ended
//     if (['completed', 'cancelled'].includes(journey.status)) {
//       return errorResponse(res, 'Journey already ended', 400);
//     }

//     // 5. Calculate total distance (start + waypoints + end)
//     let totalDistance = 0;

//     // Start to first waypoint
//     if (journey.waypoints.length > 0) {
//       totalDistance += calculateDistance(
//         journey.startLocation.coordinates.latitude,
//         journey.startLocation.coordinates.longitude,
//         journey.waypoints[0].location.coordinates.latitude,
//         journey.waypoints[0].location.coordinates.longitude
//       );

//       // Between waypoints
//       for (let i = 1; i < journey.waypoints.length; i++) {
//         const prev = journey.waypoints[i - 1].location.coordinates;
//         const curr = journey.waypoints[i].location.coordinates;
//         totalDistance += calculateDistance(prev.latitude, prev.longitude, curr.latitude, curr.longitude);
//       }

//       // Last waypoint to end
//       const lastWaypoint = journey.waypoints[journey.waypoints.length - 1];
//       totalDistance += calculateDistance(
//         lastWaypoint.location.coordinates.latitude,
//         lastWaypoint.location.coordinates.longitude,
//         latitude,
//         longitude
//       );
//     } else {
//       // No waypoints → direct start to end
//       totalDistance = calculateDistance(
//         journey.startLocation.coordinates.latitude,
//         journey.startLocation.coordinates.longitude,
//         latitude,
//         longitude
//       );
//     }

//     // 6. Duration & Speed
//     const endTime = new Date();
//     const durationMs = endTime - new Date(journey.startTime);
//     const durationMinutes = Math.round(durationMs / 60000);
//     const durationHours = durationMinutes / 60;
//     const averageSpeed = durationHours > 0 ? totalDistance / durationHours : 0;

//     // 7. Update Journey
//     journey.endLocation = {
//       coordinates: { latitude: Number(latitude), longitude: Number(longitude) },
//       address: address || 'Delivery completed'
//     };
//     journey.endTime = endTime;
//     journey.status = 'completed';
//     journey.totalDistance = parseFloat(totalDistance.toFixed(2));
//     journey.totalDuration = durationMinutes;
//     journey.averageSpeed = parseFloat(averageSpeed.toFixed(2));
//     journey.finalRemarks = finalRemarks || 'Delivery completed successfully';
//     await journey.save();

//     // 8. Update Delivery
//     const delivery = await Delivery.findById(journey.deliveryId);
//     if (delivery) {
//       delivery.status = 'delivered';
//       delivery.actualDeliveryTime = endTime;
//       await delivery.save();

//       // Status History
//       await DeliveryStatusHistory.create({
//         deliveryId: delivery._id,
//         status: 'delivered',
//         location: {
//           coordinates: { latitude: Number(latitude), longitude: Number(longitude) },
//           address: address || 'Final destination'
//         },
//         remarks: 'Journey completed by driver',
//         updatedBy: {
//           userId: driver._id,
//           userRole: 'driver',
//           userName: driver.name || 'Driver'
//         }
//       });
//     }

//     return successResponse(res, 'Journey ended & delivery marked as completed!', {
//       journey: {
//         id: journey._id,
//         totalDistance: journey.totalDistance,
//         totalDuration: journey.totalDuration,
//         averageSpeed: journey.averageSpeed,
//         status: journey.status
//       },
//       deliveryStatus: delivery?.status || 'delivered'
//     });

//   } catch (error) {
//     console.error('End Journey Error:', error.message);
//     return errorResponse(res, error.message || 'Failed to end journey', 500);
//   }
// };
exports.endJourney = async (req, res) => {
  try {
    const { journeyId } = req.params;
    const { latitude, longitude, address, finalRemarks } = req.body;

    // 1. Validate location
    if (!latitude || !longitude) {
      return errorResponse(res, 'End location (latitude & longitude) is required', 400);
    }

    // 2. Get journey
    const journey = await Journey.findById(journeyId);
    if (!journey) {
      return errorResponse(res, 'Journey not found', 404);
    }

    const driver = req.user;

    // 3. Verify ownership
    if (journey.driverId.toString() !== driver._id.toString()) {
      return errorResponse(res, 'Unauthorized: This journey does not belong to you', 403);
    }

    // 4. Check if already ended
    if (['completed', 'cancelled'].includes(journey.status)) {
      return errorResponse(res, 'Journey already ended', 400);
    }

    // 5. Calculate total distance
    let totalDistance = 0;

    if (journey.waypoints.length > 0) {
      totalDistance += calculateDistance(
        journey.startLocation.coordinates.latitude,
        journey.startLocation.coordinates.longitude,
        journey.waypoints[0].location.coordinates.latitude,
        journey.waypoints[0].location.coordinates.longitude
      );

      for (let i = 1; i < journey.waypoints.length; i++) {
        const prev = journey.waypoints[i - 1].location.coordinates;
        const curr = journey.waypoints[i].location.coordinates;
        totalDistance += calculateDistance(prev.latitude, prev.longitude, curr.latitude, curr.longitude);
      }

      const lastWaypoint = journey.waypoints[journey.waypoints.length - 1];
      totalDistance += calculateDistance(
        lastWaypoint.location.coordinates.latitude,
        lastWaypoint.location.coordinates.longitude,
        latitude,
        longitude
      );
    } else {
      totalDistance = calculateDistance(
        journey.startLocation.coordinates.latitude,
        journey.startLocation.coordinates.longitude,
        latitude,
        longitude
      );
    }

    // 6. Duration & Speed
    const endTime = new Date();
    const durationMs = endTime - new Date(journey.startTime);
    const durationMinutes = Math.round(durationMs / 60000);
    const durationHours = durationMinutes / 60;
    const averageSpeed = durationHours > 0 ? totalDistance / durationHours : 0;

    // 7. Update Journey
    journey.endLocation = {
      coordinates: { latitude: Number(latitude), longitude: Number(longitude) },
      address: address || 'Delivery completed'
    };
    journey.endTime = endTime;
    journey.status = 'completed';
    journey.totalDistance = parseFloat(totalDistance.toFixed(2));
    journey.totalDuration = durationMinutes;
    journey.averageSpeed = parseFloat(averageSpeed.toFixed(2));
    journey.finalRemarks = finalRemarks || 'Delivery completed successfully';
    await journey.save();

    // 8. Update Delivery
    const delivery = await Delivery.findById(journey.deliveryId);
    if (delivery) {
      delivery.status = 'delivered';
      delivery.actualDeliveryTime = endTime;
      await delivery.save();

      await DeliveryStatusHistory.create({
        deliveryId: delivery._id,
        status: 'delivered',
        location: {
          coordinates: { latitude: Number(latitude), longitude: Number(longitude) },
          address: address || 'Final destination'
        },
        remarks: 'Journey completed by driver',
        updatedBy: {
          userId: driver._id,
          userRole: 'driver',
          userName: driver.name || 'Driver'
        }
      });
    }

    await Driver.findByIdAndUpdate(
      driver._id,
      { 
        isAvailable: true,
        currentJourney: null,
        $unset: { activeDelivery: "" } // agar field hai to
      },
      { new: true }
    );


    return successResponse(res, 'Journey ended successfully! You are now free for new deliveries', {
      journey: {
        id: journey._id,
        status: journey.status,
        totalDistance: journey.totalDistance + ' km',
        totalDuration: journey.totalDuration + ' mins',
        averageSpeed: journey.averageSpeed + ' km/h'
      },
      driverStatus: 'Available',
      deliveryStatus: delivery?.status || 'delivered'
    });

  } catch (error) {
    console.error('End Journey Error:', error.message);
    return errorResponse(res, error.message || 'Failed to end journey', 500);
  }
};

// Add Waypoint to Journey
exports.addWaypoint = async (req, res) => {
  try {
    const { journeyId } = req.params;
    const { latitude, longitude, address, activity } = req.body;

    if (!latitude || !longitude) {
      return errorResponse(res, 'Location is required', 400);
    }

    // Get journey
    const journey = await Journey.findById(journeyId);
    if (!journey) {
      return errorResponse(res, 'Journey not found', 404);
    }

    // Verify driver
    const driver = await Driver.findOne({ userId: req.user._id });
    if (!driver || journey.driverId.toString() !== driver._id.toString()) {
      return errorResponse(res, 'Unauthorized', 403);
    }

    // Check if journey is active
    if (journey.status !== 'started' && journey.status !== 'in_progress') {
      return errorResponse(res, 'Journey is not active', 400);
    }

    // Add waypoint
    journey.waypoints.push({
      location: {
        coordinates: { latitude, longitude },
        address: address || ''
      },
      timestamp: new Date(),
      activity: activity || 'checkpoint'
    });

    journey.status = 'in_progress';
    await journey.save();

    return successResponse(res, 'Waypoint added successfully', {
      waypointIndex: journey.waypoints.length - 1,
      waypoint: journey.waypoints[journey.waypoints.length - 1]
    });

  } catch (error) {
    console.error('Add Waypoint Error:', error);
    return errorResponse(res, error.message || 'Failed to add waypoint', 500);
  }
};

// Add Journey Image
exports.addJourneyImage = async (req, res) => {
  try {
    const { journeyId } = req.params;
    const { caption, latitude, longitude } = req.body;

    // 1. File check
    if (!req.file) {
      return errorResponse(res, 'Image file is required', 400);
    }

    // 2. Journey check
    const journey = await Journey.findById(journeyId);
    if (!journey) {
      return errorResponse(res, 'Journey not found', 404);
    }

    const driver = req.user;

    // 4. Check ownership — driver started journey?
    if (journey.driverId.toString() !== driver._id.toString()) {
      return errorResponse(res, 'Unauthorized: This journey does not belong to you', 403);
    }

    // 5. Image URL
    const imageUrl = `/uploads/journey/${req.file.filename}`;

    // 6. Image data
    const imageData = {
      url: imageUrl,
      caption: caption || 'Journey image',
      timestamp: new Date()
    };

    // 7. Add location if provided
    if (latitude && longitude) {
      imageData.location = {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude)
      };
    }

    // 8. Push to journey
    journey.images.push(imageData);
    await journey.save();

    // 9. Success
    const addedImage = journey.images[journey.images.length - 1];

    return successResponse(res, 'Image added to journey successfully!', {
      image: addedImage,
      totalImages: journey.images.length
    });

  } catch (error) {
    console.error('Add Journey Image Error:', error.message);
    return errorResponse(res, error.message || 'Failed to add image', 500);
  }
};

// Upload Customer Signature
exports.uploadSignature = async (req, res) => {
  try {
    const { deliveryId } = req.params;

    // 1. Check file
    if (!req.file) {
      return errorResponse(res, 'Signature image is required', 400);
    }

    // 2. Get delivery
    const delivery = await Delivery.findById(deliveryId);
    if (!delivery) {
      return errorResponse(res, 'Delivery not found', 404);
    }

    const driver = req.user;

    // 3. Verify ownership
    if (delivery.driverId.toString() !== driver._id.toString()) {
      return errorResponse(res, 'Unauthorized: This delivery is not assigned to you', 403);
    }

    // 4. Check if delivery is ready for signature
    if (delivery.status !== 'out_for_delivery' && delivery.status !== 'in_transit') {
      return errorResponse(res, 'Cannot upload signature: Delivery not in progress', 400);
    }

    // 5. Save signature
    const signatureUrl = `/uploads/signatures/${req.file.filename}`;
    
    delivery.deliveryProof = delivery.deliveryProof || {};
    delivery.deliveryProof.signature = signatureUrl;
    delivery.deliveryProof.signedAt = new Date();
    delivery.deliveryProof.signedBy = driver.name || 'Driver';

    // Optional: Mark as delivered (if you want)
    // delivery.status = 'delivered';
    // delivery.actualDeliveryTime = new Date();

    await delivery.save();

    return successResponse(res, 'Customer signature uploaded successfully!', {
      signatureUrl,
      deliveryId: delivery._id,
      trackingNumber: delivery.trackingNumber
    });

  } catch (error) {
    console.error('Upload Signature Error:', error.message);
    return errorResponse(res, error.message || 'Failed to upload signature', 500);
  }
};

// Get Journey Details
exports.getJourneyDetails = async (req, res) => {
  try {
    const { journeyId } = req.params;

    if (!/^[0-9a-fA-F]{24}$/.test(journeyId)) {
      return errorResponse(res, 'Invalid journey ID format', 400);
    }

    const journey = await Journey.findById(journeyId)
      .populate({
        path: 'deliveryId',
        select: 'trackingNumber status pickupLocation deliveryLocation customerId'
      })
      .populate({
        path: 'driverId',
        select: 'name phone vehicleNumber vehicleType profileImage rating' 
      });

    if (!journey) {
      return errorResponse(res, 'Journey not found', 404);
    }

    // Manual formatting (clean & fast)
    const response = {
      journey: {
        id: journey._id,
        status: journey.status,
        startTime: journey.startTime,
        endTime: journey.endTime || null,
        totalDistance: journey.totalDistance || 0,
        totalDuration: journey.totalDuration || 0,
        waypoints: journey.waypoints || [],
        images: journey.images || [],
        startLocation: journey.startLocation,
        endLocation: journey.endLocation || null
      },
      delivery: journey.deliveryId ? {
        trackingNumber: journey.deliveryId.trackingNumber,
        status: journey.deliveryId.status,
        pickupLocation: journey.deliveryId.pickupLocation,
        deliveryLocation: journey.deliveryId.deliveryLocation
      } : null,
      driver: journey.driverId ? {
        id: journey.driverId._id,
        name: journey.driverId.name,
        phone: journey.driverId.phone,
        vehicleNumber: journey.driverId.vehicleNumber,
        vehicleType: journey.driverId.vehicleType,
        profileImage: journey.driverId.profileImage || null,
        rating: journey.driverId.rating || 0
      } : null
    };

    return successResponse(res, 'Journey details retrieved successfully!', response);

  } catch (error) {
    console.error('Get Journey Details Error:', error.message);
    
    if (error.name === 'CastError') {
      return errorResponse(res, 'Invalid journey ID', 400);
    }
    
    return errorResponse(res, 'Failed to retrieve journey details', 500);
  }
};

// Get Journey by Delivery
exports.getJourneyByDelivery = async (req, res) => {
  try {
    const { deliveryId } = req.params;

    const journey = await Journey.findOne({ deliveryId })
      .populate({
        path: 'driverId',
        populate: { path: 'userId', select: 'name phone' }
      });

    if (!journey) {
      return errorResponse(res, 'Journey not found for this delivery', 404);
    }

    return successResponse(res, 'Journey retrieved successfully', { journey });

  } catch (error) {
    console.error('Get Journey by Delivery Error:', error);
    return errorResponse(res, 'Failed to retrieve journey', 500);
  }
};



// Get Driver's Journey History
exports.getDriverJourneyHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const driver = req.user;

    if (!driver || driver.role !== 'driver') {
      return errorResponse(res, 'Driver profile not found or unauthorized', 404);
    }

    const query = { driverId: driver._id };
    if (status) query.status = status;

    const journeys = await Journey.find(query)
      .populate({
        path: 'deliveryId',
        select: 'trackingNumber status pickupLocation deliveryLocation'
      })
      .select('status startTime endTime totalDistance totalDuration averageSpeed waypoints images')
      .sort({ startTime: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Journey.countDocuments(query);

    // Clean & beautiful response
    const formattedJourneys = journeys.map(j => ({
      journeyId: j._id,
      trackingNumber: j.deliveryId?.trackingNumber || 'N/A',
      status: j.status,
      deliveryStatus: j.deliveryId?.status || 'unknown',
      startTime: j.startTime,
      endTime: j.endTime || null,
      duration: j.totalDuration ? `${j.totalDuration} mins` : 'In Progress',
      distance: j.totalDistance ? `${j.totalDistance.toFixed(2)} km` : 'N/A',
      averageSpeed: j.averageSpeed ? `${j.averageSpeed.toFixed(1)} km/h` : 'N/A',
      pickup: j.deliveryId?.pickupLocation?.address || 'N/A',
      delivery: j.deliveryId?.deliveryLocation?.address || 'N/A',
      totalWaypoints: j.waypoints?.length || 0,
      totalImages: j.images?.length || 0
    }));

    return successResponse(res, 'Your journey history retrieved successfully', {
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      journeys: formattedJourneys
    });

  } catch (error) {
    console.error('Get Driver Journey History Error:', error.message);
    return errorResponse(res, 'Failed to retrieve your journey history', 500);
  }
};