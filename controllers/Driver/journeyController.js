const Journey = require('../../models/Journey');
const Delivery = require('../../models/Delivery');
const Driver = require('../../models/Driver');
const DeliveryStatusHistory = require('../../models/DeliveryStatusHistory');
const { successResponse, errorResponse } = require('../../utils/responseHelper');
const { calculateDistance } = require('../../utils/geoHelper');
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

    // Update Delivery Status to picked_up
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
      remarks: 'Driver started journey - Package picked up',
      updatedBy: {
        userId: driver._id,
        userRole: 'driver',
        userName: driver.name
      }
    });

    // Update driver status
    await Driver.findByIdAndUpdate(driver._id, {
      isAvailable: false,
      currentJourney: journey._id,
      activeDelivery: delivery._id
    });

    return successResponse(res, 'Journey started successfully! Package picked up.', {
      journeyId: journey._id,
      deliveryStatus: delivery.status,
      trackingNumber: delivery.trackingNumber,
      pickupTime: delivery.actualPickupTime
    }, 201);

  } catch (error) {
    console.error('Start Journey Error:', error.message);
    return errorResponse(res, error.message || 'Failed to start journey', 500);
  }
};

// ONGOING JOURNEY (Add Checkpoint/Stop) 
exports.addCheckpoint = async (req, res) => {
  try {
    const { journeyId } = req.params;
    const { latitude, longitude, address, activity, remarks } = req.body;

    if (!latitude || !longitude) {
      return errorResponse(res, 'Location (latitude & longitude) is required', 400);
    }

    const driver = req.user;

    // Get active journey
    const journey = await Journey.findById(journeyId);
    if (!journey) {
      return errorResponse(res, 'Journey not found', 404);
    }

    // Verify driver ownership
    if (journey.driverId.toString() !== driver._id.toString()) {
      return errorResponse(res, 'Unauthorized: This journey does not belong to you', 403);
    }

    // Check if journey is active
    if (!['started', 'in_progress'].includes(journey.status)) {
      return errorResponse(res, 'Journey is not active', 400);
    }

    // Add checkpoint/waypoint
    const checkpoint = {
      location: {
        coordinates: { latitude: Number(latitude), longitude: Number(longitude) },
        address: address || 'Checkpoint location'
      },
      timestamp: new Date(),
      activity: activity || 'checkpoint', // 'checkpoint', 'stop', 'traffic', 'break'
      remarks: remarks || ''
    };

    journey.waypoints.push(checkpoint);
    journey.status = 'in_progress';
    await journey.save();

    // Create status history for checkpoint
    const delivery = await Delivery.findById(journey.deliveryId);
    if (delivery) {
      await DeliveryStatusHistory.create({
        deliveryId: delivery._id,
        status: 'in_transit',
        location: {
          coordinates: { latitude: Number(latitude), longitude: Number(longitude) },
          address: address || 'Checkpoint'
        },
        remarks: remarks || `Driver added checkpoint: ${activity}`,
        updatedBy: {
          userId: driver._id,
          userRole: 'driver',
          userName: driver.name
        }
      });
    }

    return successResponse(res, 'Checkpoint added successfully', {
      checkpointIndex: journey.waypoints.length - 1,
      checkpoint,
      totalCheckpoints: journey.waypoints.length
    });

  } catch (error) {
    console.error('Add Checkpoint Error:', error.message);
    return errorResponse(res, error.message || 'Failed to add checkpoint', 500);
  }
};

// ADD JOURNEY IMAGE 
exports.addJourneyImage = async (req, res) => {
  try {
    const { journeyId } = req.params;
    const { caption, latitude, longitude, imageType } = req.body;

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

    // 3. Check ownership
    if (journey.driverId.toString() !== driver._id.toString()) {
      return errorResponse(res, 'Unauthorized: This journey does not belong to you', 403);
    }

    // 4. Check if journey is active
    if (!['started', 'in_progress'].includes(journey.status)) {
      return errorResponse(res, 'Cannot add image: Journey is not active', 400);
    }

    // 5. Image URL
    const imageUrl = `/uploads/journey/${req.file.filename}`;

    // 6. Image data
    const imageData = {
      url: imageUrl,
      caption: caption || 'Journey image',
      timestamp: new Date(),
      imageType: imageType || 'general' // 'pickup', 'delivery', 'damage', 'general'
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

// ===================== SCREEN 4: CUSTOMER SIGNATURE =====================
exports.uploadSignature = async (req, res) => {
  try {
    const { deliveryId } = req.params;
    const { customerName, customerPhone, latitude, longitude } = req.body;

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

    // 4. Check delivery status
    if (!['picked_up', 'in_transit'].includes(delivery.status)) {
      return errorResponse(res, 'Cannot upload signature: Delivery not in valid state', 400);
    }

    // 5. Save signature
    const signatureUrl = `/uploads/signatures/${req.file.filename}`;
    
    delivery.deliveryProof = delivery.deliveryProof || {};
    delivery.deliveryProof.signature = signatureUrl;
    delivery.deliveryProof.signedAt = new Date();
    delivery.deliveryProof.signedBy = customerName || delivery.recipientName || 'Customer';
    delivery.deliveryProof.customerPhone = customerPhone || delivery.recipientPhone;

    if (latitude && longitude) {
      delivery.deliveryProof.signatureLocation = {
        latitude: Number(latitude),
        longitude: Number(longitude)
      };
    }

    await delivery.save();

    // Create status history
    await DeliveryStatusHistory.create({
      deliveryId: delivery._id,
      status: 'signature_obtained',
      location: {
        coordinates: { 
          latitude: Number(latitude) || 0, 
          longitude: Number(longitude) || 0 
        },
        address: 'Signature obtained'
      },
      remarks: `Customer signature obtained from ${customerName || 'recipient'}`,
      updatedBy: {
        userId: driver._id,
        userRole: 'driver',
        userName: driver.name
      }
    });

    return successResponse(res, 'Customer signature uploaded successfully!', {
      signatureUrl,
      deliveryId: delivery._id,
      trackingNumber: delivery.trackingNumber,
      signedBy: delivery.deliveryProof.signedBy
    });

  } catch (error) {
    console.error('Upload Signature Error:', error.message);
    return errorResponse(res, error.message || 'Failed to upload signature', 500);
  }
};

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

//  GET ACTIVE JOURNEY DETAILS
exports.getActiveJourney = async (req, res) => {
  try {
    const driver = req.user;

    const journey = await Journey.findOne({
      driverId: driver._id,
      status: { $in: ['started', 'in_progress'] }
    })
    .populate({
      path: 'deliveryId',
      select: 'trackingNumber status pickupLocation deliveryLocation recipientName recipientPhone packageDetails estimatedDeliveryTime'
    })
    .lean();

    if (!journey) {
      return successResponse(res, 'No active journey found', { journey: null });
    }

    // Format response for screen display
    const response = {
      journeyId: journey._id,
      status: journey.status,
      startTime: journey.startTime,
      duration: journey.totalDuration || Math.round((new Date() - new Date(journey.startTime)) / 60000),
      delivery: {
        trackingNumber: journey.deliveryId?.trackingNumber,
        status: journey.deliveryId?.status,
        recipient: journey.deliveryId?.recipientName,
        phone: journey.deliveryId?.recipientPhone,
        pickup: journey.deliveryId?.pickupLocation,
        destination: journey.deliveryId?.deliveryLocation,
        packageDetails: journey.deliveryId?.packageDetails,
        estimatedTime: journey.deliveryId?.estimatedDeliveryTime
      },
      startLocation: journey.startLocation,
      checkpoints: journey.waypoints?.map((wp, idx) => ({
        index: idx + 1,
        location: wp.location,
        time: wp.timestamp,
        activity: wp.activity,
        remarks: wp.remarks
      })) || [],
      images: journey.images?.map((img, idx) => ({
        index: idx + 1,
        url: img.url,
        caption: img.caption,
        timestamp: img.timestamp,
        type: img.imageType
      })) || [],
      totalCheckpoints: journey.waypoints?.length || 0,
      totalImages: journey.images?.length || 0
    };

    return successResponse(res, 'Active journey retrieved successfully', response);

  } catch (error) {
    console.error('Get Active Journey Error:', error.message);
    return errorResponse(res, 'Failed to retrieve active journey', 500);
  }
};

// GET JOURNEY DETAILS (Full History) 
exports.getJourneyDetails = async (req, res) => {
  try {
    const { journeyId } = req.params;

    if (!/^[0-9a-fA-F]{24}$/.test(journeyId)) {
      return errorResponse(res, 'Invalid journey ID format', 400);
    }

    const journey = await Journey.findById(journeyId)
      .populate({
        path: 'deliveryId',
        select: 'trackingNumber status pickupLocation deliveryLocation recipientName recipientPhone packageDetails deliveryProof'
      })
      .populate({
        path: 'driverId',
        select: 'name phone vehicleNumber vehicleType profileImage rating'
      })
      .lean();

    if (!journey) {
      return errorResponse(res, 'Journey not found', 404);
    }

    const response = {
      journey: {
        id: journey._id,
        status: journey.status,
        startTime: journey.startTime,
        endTime: journey.endTime || null,
        duration: journey.totalDuration ? `${journey.totalDuration} mins` : 'Ongoing',
        distance: journey.totalDistance ? `${journey.totalDistance} km` : 'Calculating...',
        averageSpeed: journey.averageSpeed ? `${journey.averageSpeed} km/h` : 'N/A',
        startLocation: journey.startLocation,
        endLocation: journey.endLocation || null,
        finalRemarks: journey.finalRemarks
      },
      delivery: journey.deliveryId ? {
        trackingNumber: journey.deliveryId.trackingNumber,
        status: journey.deliveryId.status,
        recipient: journey.deliveryId.recipientName,
        phone: journey.deliveryId.recipientPhone,
        pickup: journey.deliveryId.pickupLocation,
        destination: journey.deliveryId.deliveryLocation,
        packageDetails: journey.deliveryId.packageDetails,
        proof: journey.deliveryId.deliveryProof
      } : null,
      driver: journey.driverId ? {
        id: journey.driverId._id,
        name: journey.driverId.name,
        phone: journey.driverId.phone,
        vehicle: `${journey.driverId.vehicleType} - ${journey.driverId.vehicleNumber}`,
        profileImage: journey.driverId.profileImage,
        rating: journey.driverId.rating
      } : null,
      checkpoints: journey.waypoints?.map((wp, idx) => ({
        number: idx + 1,
        location: wp.location,
        time: wp.timestamp,
        activity: wp.activity,
        remarks: wp.remarks
      })) || [],
      images: journey.images?.map((img, idx) => ({
        number: idx + 1,
        url: img.url,
        caption: img.caption,
        timestamp: img.timestamp,
        location: img.location,
        type: img.imageType
      })) || []
    };

    return successResponse(res, 'Journey details retrieved successfully', response);

  } catch (error) {
    console.error('Get Journey Details Error:', error.message);
    return errorResponse(res, 'Failed to retrieve journey details', 500);
  }
};

// ===================== DRIVER JOURNEY HISTORY =====================
exports.getDriverJourneyHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const driver = req.user;

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
      totalCheckpoints: j.waypoints?.length || 0,
      totalImages: j.images?.length || 0
    }));

    return successResponse(res, 'Journey history retrieved successfully', {
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      journeys: formattedJourneys
    });

  } catch (error) {
    console.error('Get Driver Journey History Error:', error.message);
    return errorResponse(res, 'Failed to retrieve journey history', 500);
  }
};

