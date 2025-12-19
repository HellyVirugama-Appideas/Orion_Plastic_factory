// const Journey = require('../../models/Journey');
// const Delivery = require('../../models/Delivery');
// const Driver = require('../../models/Driver');
// const DeliveryStatusHistory = require('../../models/DeliveryStatusHistory');
// const { successResponse, errorResponse } = require('../../utils/responseHelper');
// const { calculateDistance } = require('../../utils/geoHelper');
// const path = require('path');
// const fs = require('fs');

// // Start Journey
// exports.startJourney = async (req, res) => {
//   try {
//     const { deliveryId, latitude, longitude, address } = req.body;

//     if (!deliveryId || latitude === undefined || longitude === undefined) {
//       return errorResponse(res, 'deliveryId, latitude and longitude are required', 400);
//     }

//     const driver = req.user;

//     if (!driver) {
//       return errorResponse(res, 'Driver not authenticated', 401);
//     }

//     // Verify delivery assigned to this driver
//     const delivery = await Delivery.findOne({
//       _id: deliveryId,
//       driverId: driver._id,    
//       status: 'assigned'
//     });

//     if (!delivery) {
//       return errorResponse(res, 'Delivery not found or not assigned to you', 404);
//     }

//     // Check if journey already exists
//     const existingJourney = await Journey.findOne({
//       deliveryId,
//       status: { $in: ['started', 'in_progress'] }
//     });

//     if (existingJourney) {
//       return errorResponse(res, 'Journey already started', 400);
//     }

//     // Create Journey
//     const journey = await Journey.create({
//       deliveryId,
//       driverId: driver._id,
//       startLocation: {
//         coordinates: { latitude: Number(latitude), longitude: Number(longitude) },
//         address: address || 'Location captured via GPS'
//       },
//       startTime: new Date(),
//       status: 'started'
//     });

//     // Update Delivery Status to picked_up
//     delivery.status = 'picked_up';
//     delivery.actualPickupTime = new Date();
//     await delivery.save();

//     // Delivery Status History
//     await DeliveryStatusHistory.create({
//       deliveryId: delivery._id,
//       status: 'picked_up',
//       location: {
//         coordinates: { latitude: Number(latitude), longitude: Number(longitude) },
//         address: address || 'GPS Location'
//       },
//       remarks: 'Driver started journey - Package picked up',
//       updatedBy: {
//         userId: driver._id,
//         userRole: 'driver',
//         userName: driver.name
//       }
//     });

//     // Update driver status
//     await Driver.findByIdAndUpdate(driver._id, {
//       isAvailable: false,
//       currentJourney: journey._id,
//       activeDelivery: delivery._id
//     });

//     return successResponse(res, 'Journey started successfully! Package picked up.', {
//       journeyId: journey._id,
//       deliveryStatus: delivery.status,
//       trackingNumber: delivery.trackingNumber,
//       pickupTime: delivery.actualPickupTime
//     }, 201);

//   } catch (error) {
//     console.error('Start Journey Error:', error.message);
//     return errorResponse(res, error.message || 'Failed to start journey', 500);
//   }
// };

// // ONGOING JOURNEY (Add Checkpoint/Stop) 
// exports.addCheckpoint = async (req, res) => {
//   try {
//     const { journeyId } = req.params;
//     const { latitude, longitude, address, activity, remarks } = req.body;

//     if (!latitude || !longitude) {
//       return errorResponse(res, 'Location (latitude & longitude) is required', 400);
//     }

//     const driver = req.user;

//     // Get active journey
//     const journey = await Journey.findById(journeyId);
//     if (!journey) {
//       return errorResponse(res, 'Journey not found', 404);
//     }

//     // Verify driver ownership
//     if (journey.driverId.toString() !== driver._id.toString()) {
//       return errorResponse(res, 'Unauthorized: This journey does not belong to you', 403);
//     }

//     // Check if journey is active
//     if (!['started', 'in_progress'].includes(journey.status)) {
//       return errorResponse(res, 'Journey is not active', 400);
//     }

//     // Add checkpoint/waypoint
//     const checkpoint = {
//       location: {
//         coordinates: { latitude: Number(latitude), longitude: Number(longitude) },
//         address: address || 'Checkpoint location'
//       },
//       timestamp: new Date(),
//       activity: activity || 'checkpoint', // 'checkpoint', 'stop', 'traffic', 'break'
//       remarks: remarks || ''
//     };

//     journey.waypoints.push(checkpoint);
//     journey.status = 'in_progress';
//     await journey.save();

//     // Create status history for checkpoint
//     const delivery = await Delivery.findById(journey.deliveryId);
//     if (delivery) {
//       await DeliveryStatusHistory.create({
//         deliveryId: delivery._id,
//         status: 'in_transit',
//         location: {
//           coordinates: { latitude: Number(latitude), longitude: Number(longitude) },
//           address: address || 'Checkpoint'
//         },
//         remarks: remarks || `Driver added checkpoint: ${activity}`,
//         updatedBy: {
//           userId: driver._id,
//           userRole: 'driver',
//           userName: driver.name
//         }
//       });
//     }

//     return successResponse(res, 'Checkpoint added successfully', {
//       checkpointIndex: journey.waypoints.length - 1,
//       checkpoint,
//       totalCheckpoints: journey.waypoints.length
//     });

//   } catch (error) {
//     console.error('Add Checkpoint Error:', error.message);
//     return errorResponse(res, error.message || 'Failed to add checkpoint', 500);
//   }
// };

// // ADD JOURNEY IMAGE 
// exports.addJourneyImage = async (req, res) => {
//   try {
//     const { journeyId } = req.params;
//     const { caption, latitude, longitude, imageType } = req.body;

//     // 1. File check
//     if (!req.file) {
//       return errorResponse(res, 'Image file is required', 400);
//     }

//     // 2. Journey check
//     const journey = await Journey.findById(journeyId);
//     if (!journey) {
//       return errorResponse(res, 'Journey not found', 404);
//     }

//     const driver = req.user;

//     // 3. Check ownership
//     if (journey.driverId.toString() !== driver._id.toString()) {
//       return errorResponse(res, 'Unauthorized: This journey does not belong to you', 403);
//     }

//     // 4. Check if journey is active
//     if (!['started', 'in_progress'].includes(journey.status)) {
//       return errorResponse(res, 'Cannot add image: Journey is not active', 400);
//     }

//     // 5. Image URL
//     const imageUrl = `/uploads/journey/${req.file.filename}`;

//     // 6. Image data
//     const imageData = {
//       url: imageUrl,
//       caption: caption || 'Journey image',
//       timestamp: new Date(),
//       imageType: imageType || 'general' // 'pickup', 'delivery', 'damage', 'general'
//     };

//     // 7. Add location if provided
//     if (latitude && longitude) {
//       imageData.location = {
//         latitude: parseFloat(latitude),
//         longitude: parseFloat(longitude)
//       };
//     }

//     // 8. Push to journey
//     journey.images.push(imageData);
//     await journey.save();

//     // 9. Success
//     const addedImage = journey.images[journey.images.length - 1];

//     return successResponse(res, 'Image added to journey successfully!', {
//       image: addedImage,
//       totalImages: journey.images.length
//     });

//   } catch (error) {
//     console.error('Add Journey Image Error:', error.message);
//     return errorResponse(res, error.message || 'Failed to add image', 500);
//   }
// };

// //  SCREEN 4: CUSTOMER SIGNATURE 
// exports.uploadSignature = async (req, res) => {
//   try {
//     const { deliveryId } = req.params;
//     const { customerName, customerPhone, latitude, longitude } = req.body;

//     // 1. Check file
//     if (!req.file) {
//       return errorResponse(res, 'Signature image is required', 400);
//     }

//     // 2. Get delivery
//     const delivery = await Delivery.findById(deliveryId);
//     if (!delivery) {
//       return errorResponse(res, 'Delivery not found', 404);
//     }

//     const driver = req.user;

//     // 3. Verify ownership
//     if (delivery.driverId.toString() !== driver._id.toString()) {
//       return errorResponse(res, 'Unauthorized: This delivery is not assigned to you', 403);
//     }

//     // 4. Check delivery status
//     if (!['picked_up', 'in_transit'].includes(delivery.status)) {
//       return errorResponse(res, 'Cannot upload signature: Delivery not in valid state', 400);
//     }

//     // 5. Save signature
//     const signatureUrl = `/uploads/signatures/${req.file.filename}`;

//     delivery.deliveryProof = delivery.deliveryProof || {};
//     delivery.deliveryProof.signature = signatureUrl;
//     delivery.deliveryProof.signedAt = new Date();
//     delivery.deliveryProof.signedBy = customerName || delivery.recipientName || 'Customer';
//     delivery.deliveryProof.customerPhone = customerPhone || delivery.recipientPhone;

//     if (latitude && longitude) {
//       delivery.deliveryProof.signatureLocation = {
//         latitude: Number(latitude),
//         longitude: Number(longitude)
//       };
//     }

//     await delivery.save();

//     // Create status history
//     await DeliveryStatusHistory.create({
//       deliveryId: delivery._id,
//       status: 'signature_obtained',
//       location: {
//         coordinates: { 
//           latitude: Number(latitude) || 0, 
//           longitude: Number(longitude) || 0 
//         },
//         address: 'Signature obtained'
//       },
//       remarks: `Customer signature obtained from ${customerName || 'recipient'}`,
//       updatedBy: {
//         userId: driver._id,
//         userRole: 'driver',
//         userName: driver.name
//       }
//     });

//     return successResponse(res, 'Customer signature uploaded successfully!', {
//       signatureUrl,
//       deliveryId: delivery._id,
//       trackingNumber: delivery.trackingNumber,
//       signedBy: delivery.deliveryProof.signedBy
//     });

//   } catch (error) {
//     console.error('Upload Signature Error:', error.message);
//     return errorResponse(res, error.message || 'Failed to upload signature', 500);
//   }
// };

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

//     const driver = req.user;

//     // 3. Verify ownership
//     if (journey.driverId.toString() !== driver._id.toString()) {
//       return errorResponse(res, 'Unauthorized: This journey does not belong to you', 403);
//     }

//     // 4. Check if already ended
//     if (['completed', 'cancelled'].includes(journey.status)) {
//       return errorResponse(res, 'Journey already ended', 400);
//     }

//     // 5. Calculate total distance
//     let totalDistance = 0;

//     if (journey.waypoints.length > 0) {
//       totalDistance += calculateDistance(
//         journey.startLocation.coordinates.latitude,
//         journey.startLocation.coordinates.longitude,
//         journey.waypoints[0].location.coordinates.latitude,
//         journey.waypoints[0].location.coordinates.longitude
//       );

//       for (let i = 1; i < journey.waypoints.length; i++) {
//         const prev = journey.waypoints[i - 1].location.coordinates;
//         const curr = journey.waypoints[i].location.coordinates;
//         totalDistance += calculateDistance(prev.latitude, prev.longitude, curr.latitude, curr.longitude);
//       }

//       const lastWaypoint = journey.waypoints[journey.waypoints.length - 1];
//       totalDistance += calculateDistance(
//         lastWaypoint.location.coordinates.latitude,
//         lastWaypoint.location.coordinates.longitude,
//         latitude,
//         longitude
//       );
//     } else {
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

//     await Driver.findByIdAndUpdate(
//       driver._id,
//       { 
//         isAvailable: true,
//         currentJourney: null,
//         $unset: { activeDelivery: "" } // agar field hai to
//       },
//       { new: true }
//     );


//     return successResponse(res, 'Journey ended successfully! You are now free for new deliveries', {
//       journey: {
//         id: journey._id,
//         status: journey.status,
//         totalDistance: journey.totalDistance + ' km',
//         totalDuration: journey.totalDuration + ' mins',
//         averageSpeed: journey.averageSpeed + ' km/h'
//       },
//       driverStatus: 'Available',
//       deliveryStatus: delivery?.status || 'delivered'
//     });

//   } catch (error) {
//     console.error('End Journey Error:', error.message);
//     return errorResponse(res, error.message || 'Failed to end journey', 500);
//   }
// };

// //  GET ACTIVE JOURNEY DETAILS
// exports.getActiveJourney = async (req, res) => {
//   try {
//     const driver = req.user;

//     const journey = await Journey.findOne({
//       driverId: driver._id,
//       status: { $in: ['started', 'in_progress'] }
//     })
//     .populate({
//       path: 'deliveryId',
//       select: 'trackingNumber status pickupLocation deliveryLocation recipientName recipientPhone packageDetails estimatedDeliveryTime'
//     })
//     .lean();

//     if (!journey) {
//       return successResponse(res, 'No active journey found', { journey: null });
//     }

//     // Format response for screen display
//     const response = {
//       journeyId: journey._id,
//       status: journey.status,
//       startTime: journey.startTime,
//       duration: journey.totalDuration || Math.round((new Date() - new Date(journey.startTime)) / 60000),
//       delivery: {
//         trackingNumber: journey.deliveryId?.trackingNumber,
//         status: journey.deliveryId?.status,
//         recipient: journey.deliveryId?.recipientName,
//         phone: journey.deliveryId?.recipientPhone,
//         pickup: journey.deliveryId?.pickupLocation,
//         destination: journey.deliveryId?.deliveryLocation,
//         packageDetails: journey.deliveryId?.packageDetails,
//         estimatedTime: journey.deliveryId?.estimatedDeliveryTime
//       },
//       startLocation: journey.startLocation,
//       checkpoints: journey.waypoints?.map((wp, idx) => ({
//         index: idx + 1,
//         location: wp.location,
//         time: wp.timestamp,
//         activity: wp.activity,
//         remarks: wp.remarks
//       })) || [],
//       images: journey.images?.map((img, idx) => ({
//         index: idx + 1,
//         url: img.url,
//         caption: img.caption,
//         timestamp: img.timestamp,
//         type: img.imageType
//       })) || [],
//       totalCheckpoints: journey.waypoints?.length || 0,
//       totalImages: journey.images?.length || 0
//     };

//     return successResponse(res, 'Active journey retrieved successfully', response);

//   } catch (error) {
//     console.error('Get Active Journey Error:', error.message);
//     return errorResponse(res, 'Failed to retrieve active journey', 500);
//   }
// };

// // GET JOURNEY DETAILS (Full History) 
// exports.getJourneyDetails = async (req, res) => {
//   try {
//     const { journeyId } = req.params;

//     if (!/^[0-9a-fA-F]{24}$/.test(journeyId)) {
//       return errorResponse(res, 'Invalid journey ID format', 400);
//     }

//     const journey = await Journey.findById(journeyId)
//       .populate({
//         path: 'deliveryId',
//         select: 'trackingNumber status pickupLocation deliveryLocation recipientName recipientPhone packageDetails deliveryProof'
//       })
//       .populate({
//         path: 'driverId',
//         select: 'name phone vehicleNumber vehicleType profileImage rating'
//       })
//       .lean();

//     if (!journey) {
//       return errorResponse(res, 'Journey not found', 404);
//     }

//     const response = {
//       journey: {
//         id: journey._id,
//         status: journey.status,
//         startTime: journey.startTime,
//         endTime: journey.endTime || null,
//         duration: journey.totalDuration ? `${journey.totalDuration} mins` : 'Ongoing',
//         distance: journey.totalDistance ? `${journey.totalDistance} km` : 'Calculating...',
//         averageSpeed: journey.averageSpeed ? `${journey.averageSpeed} km/h` : 'N/A',
//         startLocation: journey.startLocation,
//         endLocation: journey.endLocation || null,
//         finalRemarks: journey.finalRemarks
//       },
//       delivery: journey.deliveryId ? {
//         trackingNumber: journey.deliveryId.trackingNumber,
//         status: journey.deliveryId.status,
//         recipient: journey.deliveryId.recipientName,
//         phone: journey.deliveryId.recipientPhone,
//         pickup: journey.deliveryId.pickupLocation,
//         destination: journey.deliveryId.deliveryLocation,
//         packageDetails: journey.deliveryId.packageDetails,
//         proof: journey.deliveryId.deliveryProof
//       } : null,
//       driver: journey.driverId ? {
//         id: journey.driverId._id,
//         name: journey.driverId.name,
//         phone: journey.driverId.phone,
//         vehicle: `${journey.driverId.vehicleType} - ${journey.driverId.vehicleNumber}`,
//         profileImage: journey.driverId.profileImage,
//         rating: journey.driverId.rating
//       } : null,
//       checkpoints: journey.waypoints?.map((wp, idx) => ({
//         number: idx + 1,
//         location: wp.location,
//         time: wp.timestamp,
//         activity: wp.activity,
//         remarks: wp.remarks
//       })) || [],
//       images: journey.images?.map((img, idx) => ({
//         number: idx + 1,
//         url: img.url,
//         caption: img.caption,
//         timestamp: img.timestamp,
//         location: img.location,
//         type: img.imageType
//       })) || []
//     };

//     return successResponse(res, 'Journey details retrieved successfully', response);

//   } catch (error) {
//     console.error('Get Journey Details Error:', error.message);
//     return errorResponse(res, 'Failed to retrieve journey details', 500);
//   }
// };

// //  DRIVER JOURNEY HISTORY 
// exports.getDriverJourneyHistory = async (req, res) => {
//   try {
//     const { page = 1, limit = 10, status } = req.query;
//     const driver = req.user;

//     const query = { driverId: driver._id };
//     if (status) query.status = status;

//     const journeys = await Journey.find(query)
//       .populate({
//         path: 'deliveryId',
//         select: 'trackingNumber status pickupLocation deliveryLocation'
//       })
//       .select('status startTime endTime totalDistance totalDuration averageSpeed waypoints images')
//       .sort({ startTime: -1 })
//       .limit(limit * 1)
//       .skip((page - 1) * limit)
//       .lean();

//     const total = await Journey.countDocuments(query);

//     const formattedJourneys = journeys.map(j => ({
//       journeyId: j._id,
//       trackingNumber: j.deliveryId?.trackingNumber || 'N/A',
//       status: j.status,
//       deliveryStatus: j.deliveryId?.status || 'unknown',
//       startTime: j.startTime,
//       endTime: j.endTime || null,
//       duration: j.totalDuration ? `${j.totalDuration} mins` : 'In Progress',
//       distance: j.totalDistance ? `${j.totalDistance.toFixed(2)} km` : 'N/A',
//       averageSpeed: j.averageSpeed ? `${j.averageSpeed.toFixed(1)} km/h` : 'N/A',
//       pickup: j.deliveryId?.pickupLocation?.address || 'N/A',
//       delivery: j.deliveryId?.deliveryLocation?.address || 'N/A',
//       totalCheckpoints: j.waypoints?.length || 0,
//       totalImages: j.images?.length || 0
//     }));

//     return successResponse(res, 'Journey history retrieved successfully', {
//       total,
//       page: parseInt(page),
//       pages: Math.ceil(total / limit),
//       journeys: formattedJourneys
//     });

//   } catch (error) {
//     console.error('Get Driver Journey History Error:', error.message);
//     return errorResponse(res, 'Failed to retrieve journey history', 500);
//   }
// };




const Journey = require('../../models/Journey');
const Delivery = require('../../models/Delivery');
const Driver = require('../../models/Driver');
const DeliveryStatusHistory = require('../../models/DeliveryStatusHistory');
const { successResponse, errorResponse } = require('../../utils/responseHelper');
const { calculateDistance } = require('../../utils/geoHelper');

// START JOURNEY 
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

// ADD CHECKPOINT 
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
      activity: activity || 'checkpoint',
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

//  ADD JOURNEY IMAGE 
exports.addJourneyImage = async (req, res) => {
  try {
    const { journeyId } = req.params;
    const { caption, latitude, longitude, imageType } = req.body;

    if (!req.file) {
      return errorResponse(res, 'Image file is required', 400);
    }

    const journey = await Journey.findById(journeyId);
    if (!journey) {
      return errorResponse(res, 'Journey not found', 404);
    }

    const driver = req.user;

    if (journey.driverId.toString() !== driver._id.toString()) {
      return errorResponse(res, 'Unauthorized: This journey does not belong to you', 403);
    }

    if (!['started', 'in_progress'].includes(journey.status)) {
      return errorResponse(res, 'Cannot add image: Journey is not active', 400);
    }

    const imageUrl = `/uploads/journey/${req.file.filename}`;

    const imageData = {
      url: imageUrl,
      caption: caption || 'Journey image',
      timestamp: new Date(),
      imageType: imageType || 'general'
    };

    if (latitude && longitude) {
      imageData.location = {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude)
      };
    }

    journey.images.push(imageData);
    await journey.save();

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

// INITIATE CALL 
// exports.initiateCall = async (req, res) => {
//   try {
//     const { journeyId } = req.params;
//     const { contactName, phoneNumber: providedPhone } = req.body; // phoneNumber is optional

//     const driver = req.user;
//     const journey = await Journey.findById(journeyId);

//     if (!journey) {
//       return errorResponse(res, 'Journey not found', 404);
//     }

//     if (journey.driverId.toString() !== driver._id.toString()) {
//       return errorResponse(res, 'Unauthorized: This journey does not belong to you', 403);
//     }

//     if (!journey.isActive()) {
//       return errorResponse(res, 'Journey is not active', 400);
//     }

//     // Fetch delivery to get customer phone
//     const delivery = await Delivery.findById(journey.deliveryId);

//     if (!delivery) {
//       return errorResponse(res, 'Delivery not found', 404);
//     }

//     // Determine phone number: use provided one OR fallback to delivery's recipient phone
//     const phoneNumber = providedPhone || delivery.recipientPhone;

//     // NOW validate: only after trying to get it from delivery
//     if (!phoneNumber) {
//       return errorResponse(res, 'Phone number not available. Customer phone is missing in delivery.', 400);
//     }

//     const finalContactName = contactName || delivery.recipientName || 'Customer';

//     // Log the call
//     const callLog = {
//       type: 'call',
//       phoneNumber,
//       contactName: finalContactName,
//       timestamp: new Date(),
//       status: 'initiated',
//       duration: 0
//     };

//     journey.communicationLog.push(callLog);
//     await journey.save();

//     return successResponse(res, 'Call initiated successfully', {
//       callId: journey.communicationLog[journey.communicationLog.length - 1]._id,
//       phoneNumber,
//       callUrl: `tel:${phoneNumber}`,
//       contactName: finalContactName,
//       totalCalls: journey.communicationLog.filter(log => log.type === 'call').length
//     });

//   } catch (error) {
//     console.error('Initiate Call Error:', error.message);
//     return errorResponse(res, error.message || 'Failed to initiate call', 500);
//   }
// };

exports.initiateCall = async (req, res) => {
  try {
    const { journeyId } = req.params;
    const { contactName, phoneNumber: providedPhone } = req.body; // phoneNumber optional

    const driver = req.user;
    const journey = await Journey.findById(journeyId);

    if (!journey) {
      return errorResponse(res, 'Journey not found', 404);
    }

    if (journey.driverId.toString() !== driver._id.toString()) {
      return errorResponse(res, 'Unauthorized: This journey does not belong to you', 403);
    }

    if (!journey.isActive()) {
      return errorResponse(res, 'Journey is not active', 400);
    }

    // Fetch delivery
    const delivery = await Delivery.findById(journey.deliveryId)
      .populate('customerId', 'phoneNumber phone name fullName'); // Populate customer fields

    if (!delivery) {
      return errorResponse(res, 'Delivery not found', 404);
    }

    if (!delivery.customerId) {
      return errorResponse(res, 'Customer not associated with this delivery', 400);
    }

    // Determine phone number
    const phoneNumber = providedPhone || delivery.customerId.phoneNumber || delivery.customerId.phone;

    if (!phoneNumber) {
      return errorResponse(res, 'Customer phone number not found', 400);
    }

    // Determine contact name
    const finalContactName =
      contactName ||
      delivery.customerId.name ||
      delivery.customerId.fullName ||
      delivery.recipientName ||
      'Customer';

    // Log the call
    const callLog = {
      type: 'call',
      phoneNumber,
      contactName: finalContactName,
      timestamp: new Date(),
      status: 'initiated',
      duration: 0
    };

    journey.communicationLog.push(callLog);
    await journey.save();

    return successResponse(res, 'Call initiated successfully', {
      callId: journey.communicationLog[journey.communicationLog.length - 1]._id,
      phoneNumber,
      callUrl: `tel:${phoneNumber}`,
      contactName: finalContactName,
      totalCalls: journey.communicationLog.filter(log => log.type === 'call').length
    });

  } catch (error) {
    console.error('Initiate Call Error:', error.message);
    return errorResponse(res, error.message || 'Failed to initiate call', 500);
  }
};

// END CALL 
exports.endCall = async (req, res) => {
  try {
    const { journeyId, callId } = req.params;
    const { duration, status } = req.body;

    const driver = req.user;
    const journey = await Journey.findById(journeyId);

    if (!journey) {
      return errorResponse(res, 'Journey not found', 404);
    }

    if (journey.driverId.toString() !== driver._id.toString()) {
      return errorResponse(res, 'Unauthorized', 403);
    }

    // Find the call log entry
    const callLog = journey.communicationLog.id(callId);

    if (!callLog) {
      return errorResponse(res, 'Call log not found', 404);
    }

    // Update call details
    callLog.duration = duration || 0;
    callLog.status = status || 'completed';

    await journey.save();

    return successResponse(res, 'Call ended and logged successfully', {
      callId: callLog._id,
      duration: `${duration} seconds`,
      status: callLog.status
    });

  } catch (error) {
    console.error('End Call Error:', error.message);
    return errorResponse(res, error.message || 'Failed to end call', 500);
  }
};

// INITIATE WHATSAPP 
exports.initiateWhatsApp = async (req, res) => {
  try {
    const { journeyId } = req.params;
    const { contactName, phoneNumber: providedPhone, message } = req.body;

    const driver = req.user;
    const journey = await Journey.findById(journeyId)
      .populate({
        path: 'deliveryId',
        populate: { path: 'customerId', select: 'phone name fullName' }
      });

    if (!journey) {
      return errorResponse(res, 'Journey not found', 404);
    }

    if (journey.driverId.toString() !== driver._id.toString()) {
      return errorResponse(res, 'Unauthorized', 403);
    }

    if (!journey.isActive()) {
      return errorResponse(res, 'Journey is not active', 400);
    }

    const delivery = journey.deliveryId;

    if (!delivery) {
      return errorResponse(res, 'Delivery not found', 404);
    }

    // Priority: providedPhone > recipientPhone > customer.phone
    let phoneNumber = providedPhone || delivery.recipientPhone || delivery.customerId?.phone;

    if (!phoneNumber) {
      return errorResponse(res, 'Phone number not available', 400);
    }

    // Clean phone for WhatsApp (remove + , spaces, dashes)
    const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');

    // If phone starts with 0 (local format), remove it and add country code if needed
    // Optional: Agar India mein ho to +91 add kar do agar nahi hai
    const whatsappReadyPhone = cleanPhone.startsWith('91') && cleanPhone.length === 12
      ? cleanPhone
      : cleanPhone.startsWith('0')
        ? '91' + cleanPhone.substring(1)
        : cleanPhone.length === 10
          ? '91' + cleanPhone
          : cleanPhone;

    const finalContactName = contactName || delivery.recipientName || delivery.customerId?.fullName || delivery.customerId?.name || 'Customer';

    // Default message agar nahi diya
    const defaultMessage = message || `Hello ${finalContactName}, your delivery is on the way. I'll reach you soon. - ${driver.name}`;

    // Log in journey
    const whatsappLog = {
      type: 'whatsapp',
      phoneNumber: whatsappReadyPhone,
      contactName: finalContactName,
      timestamp: new Date(),
      status: 'initiated',
      remarks: defaultMessage
    };

    journey.communicationLog.push(whatsappLog);
    await journey.save();

    // Generate WhatsApp deep link
    const whatsappUrl = `https://wa.me/${whatsappReadyPhone}?text=${encodeURIComponent(defaultMessage)}`;

    return successResponse(res, 'WhatsApp initiated successfully', {
      whatsappId: journey.communicationLog[journey.communicationLog.length - 1]._id,
      phoneNumber: whatsappReadyPhone,
      whatsappUrl,
      contactName: finalContactName,
      message: defaultMessage,
      totalWhatsAppMessages: journey.communicationLog.filter(log => log.type === 'whatsapp').length
    });

  } catch (error) {
    console.error('Initiate WhatsApp Error:', error);
    return errorResponse(res, 'Failed to initiate WhatsApp', 500);
  }
};

//  GET NAVIGATION 
// exports.getNavigation = async (req, res) => {
//   try {
//     const { journeyId } = req.params;
//     const { currentLatitude, currentLongitude, navigationType } = req.query;

//     const driver = req.user;
//     const journey = await Journey.findById(journeyId)
//       .populate('deliveryId', 'deliveryLocation recipientName recipientPhone');

//     if (!journey) {
//       return errorResponse(res, 'Journey not found', 404);
//     }

//     if (journey.driverId.toString() !== driver._id.toString()) {
//       return errorResponse(res, 'Unauthorized', 403);
//     }

//     const delivery = journey.deliveryId;
//     const destination = delivery.deliveryLocation;

//     if (!destination || !destination.coordinates) {
//       return errorResponse(res, 'Delivery location not available', 400);
//     }

//     const destLat = destination.coordinates.latitude;
//     const destLng = destination.coordinates.longitude;

//     // Calculate distance if current location provided
//     let estimatedDistance = null;
//     let estimatedDuration = null;

//     if (currentLatitude && currentLongitude) {
//       estimatedDistance = calculateDistance(
//         parseFloat(currentLatitude),
//         parseFloat(currentLongitude),
//         destLat,
//         destLng
//       );
//       // Rough estimate: 40 km/h average speed
//       estimatedDuration = Math.round((estimatedDistance / 40) * 60); // in minutes
//     }

//     // Generate navigation URLs
//     const navigationUrls = {
//       googleMaps: `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}&travelmode=driving`,
//       appleMaps: `http://maps.apple.com/?daddr=${destLat},${destLng}&dirflg=d`,
//       waze: `https://waze.com/ul?ll=${destLat},${destLng}&navigate=yes`
//     };

//     // Log navigation history
//     const navLog = {
//       destination: {
//         address: destination.address,
//         coordinates: {
//           latitude: destLat,
//           longitude: destLng
//         }
//       },
//       startedAt: new Date(),
//       navigationApp: navigationType || 'google_maps',
//       estimatedDistance,
//       estimatedDuration
//     };

//     journey.navigationHistory.push(navLog);
//     await journey.save();

//     return successResponse(res, 'Navigation details retrieved', {
//       destination: {
//         address: destination.address,
//         coordinates: { latitude: destLat, longitude: destLng },
//         recipientName: delivery.recipientName,
//         recipientPhone: delivery.recipientPhone
//       },
//       navigation: navigationUrls,
//       estimatedDistance: estimatedDistance ? `${estimatedDistance.toFixed(2)} km` : 'N/A',
//       estimatedDuration: estimatedDuration ? `${estimatedDuration} mins` : 'N/A',
//       navigationHistoryId: journey.navigationHistory[journey.navigationHistory.length - 1]._id
//     });

//   } catch (error) {
//     console.error('Get Navigation Error:', error.message);
//     return errorResponse(res, error.message || 'Failed to get navigation', 500);
//   }
// };

exports.getNavigation = async (req, res) => {
  try {
    const { journeyId } = req.params;
    const { currentLatitude, currentLongitude } = req.query;

    const driver = req.user;

    const journey = await Journey.findById(journeyId)
      .populate({
        path: 'deliveryId',
        select: 'deliveryLocation recipientName recipientPhone'
      });

    if (!journey) {
      return errorResponse(res, 'Journey not found', 404);
    }

    if (journey.driverId.toString() !== driver._id.toString()) {
      return errorResponse(res, 'Unauthorized', 403);
    }

    if (!journey.isActive()) {
      return errorResponse(res, 'Journey is not active', 400);
    }

    const delivery = journey.deliveryId;
    const destination = delivery.deliveryLocation;

    if (!destination || !destination.coordinates) {
      return errorResponse(res, 'Delivery location not available', 400);
    }

    const destLat = destination.coordinates.latitude;
    const destLng = destination.coordinates.longitude;

    // Default values
    let distance = null;
    let duration = null;
    let routePolyline = null; // for drawing route on map

    // If current location provided, calculate real distance using Google Directions API
    if (currentLatitude && currentLongitude) {
      const origin = `${currentLatitude},${currentLongitude}`;
      const destinationCoord = `${destLat},${destLng}`;

      try {
        const directionsResponse = await axios.get(
          `https://maps.googleapis.com/maps/api/directions/json`,
          {
            params: {
              origin,
              destination: destinationCoord,
              key: process.env.GOOGLE_MAPS_API_KEY,
              mode: 'driving',
              traffic_model: 'best_guess',
              departure_time: 'now'
            }
          }
        );

        const route = directionsResponse.data.routes[0];
        if (route) {
          const leg = route.legs[0];
          distance = leg.distance.value / 1000; // meters to km
          duration = Math.round(leg.duration_in_traffic?.value / 60) || Math.round(leg.duration.value / 60); // minutes

          // Polyline for drawing route on map
          routePolyline = route.overview_polyline.points;
        }
      } catch (apiError) {
        console.error('Google Directions API Error:', apiError.message);
        // Fallback to Haversine if API fails
        distance = calculateDistance(
          parseFloat(currentLatitude),
          parseFloat(currentLongitude),
          destLat,
          destLng
        );
        duration = Math.round((distance / 40) * 60); // rough estimate
      }
    }

    // Log navigation
    const navLog = {
      destination: {
        address: destination.address || 'Unknown',
        coordinates: { latitude: destLat, longitude: destLng }
      },
      startedAt: new Date(),
      estimatedDistance: distance,
      estimatedDuration: duration
    };

    journey.navigationHistory.push(navLog);
    await journey.save();

    return successResponse(res, 'Navigation data ready for in-app map', {
      destination: {
        address: destination.address || 'Unknown Address',
        coordinates: { latitude: destLat, longitude: destLng },
        recipientName: delivery.recipientName || 'Customer',
        recipientPhone: delivery.recipientPhone || null
      },
      driverCurrentLocation: currentLatitude && currentLongitude ? {
        latitude: parseFloat(currentLatitude),
        longitude: parseFloat(currentLongitude)
      } : null,
      distance: distance ? `${distance.toFixed(2)} km` : 'N/A',
      duration: duration ? `${duration} mins` : 'N/A',
      routePolyline: routePolyline || null, // frontend map pe route draw karega
      navigationHistoryId: journey.navigationHistory[journey.navigationHistory.length - 1]._id
    });

  } catch (error) {
    console.error('Get Navigation Error:', error);
    return errorResponse(res, 'Failed to get navigation data', 500);
  }
};

//  UPLOAD RECORDING/SCREENSHOT 
exports.uploadRecording = async (req, res) => {
  try {
    const { journeyId } = req.params;
    const { type, caption, waypointIndex } = req.body;

    if (!req.file) {
      return errorResponse(res, 'Recording file is required', 400);
    }

    const driver = req.user;
    const journey = await Journey.findById(journeyId);

    if (!journey) {
      return errorResponse(res, 'Journey not found', 404);
    }

    if (journey.driverId.toString() !== driver._id.toString()) {
      return errorResponse(res, 'Unauthorized', 403);
    }

    const recordingUrl = `/uploads/recordings/${req.file.filename}`;

    const recording = {
      recordingId: `REC_${Date.now()}`,
      type: type || 'screenshot',
      url: recordingUrl,
      timestamp: new Date(),
      waypointIndex: waypointIndex ? parseInt(waypointIndex) : null,
      fileSize: req.file.size,
      duration: req.body.duration || null,
      isHidden: false
    };

    journey.recordings.push(recording);
    await journey.save();

    return successResponse(res, 'Recording uploaded successfully', {
      recording: journey.recordings[journey.recordings.length - 1],
      totalRecordings: journey.recordings.length
    });

  } catch (error) {
    console.error('Upload Recording Error:', error.message);
    return errorResponse(res, error.message || 'Failed to upload recording', 500);
  }
};

//  GET COMMUNICATION HISTORY 
exports.getCommunicationHistory = async (req, res) => {
  try {
    const { journeyId } = req.params;
    const { type } = req.query; // 'call', 'whatsapp', 'sms'

    const driver = req.user;
    const journey = await Journey.findById(journeyId)
      .populate('deliveryId', 'trackingNumber recipientName recipientPhone');

    if (!journey) {
      return errorResponse(res, 'Journey not found', 404);
    }

    if (journey.driverId.toString() !== driver._id.toString()) {
      return errorResponse(res, 'Unauthorized', 403);
    }

    let communicationLog = journey.communicationLog;

    // Filter by type if specified
    if (type) {
      communicationLog = communicationLog.filter(log => log.type === type);
    }

    // Format the response
    const formattedLog = communicationLog.map(log => ({
      id: log._id,
      type: log.type,
      contactName: log.contactName,
      phoneNumber: log.phoneNumber,
      timestamp: log.timestamp,
      duration: log.duration ? `${log.duration} seconds` : 'N/A',
      status: log.status,
      remarks: log.remarks
    }));

    // Summary statistics
    const summary = {
      totalCalls: journey.communicationLog.filter(log => log.type === 'call').length,
      totalWhatsApp: journey.communicationLog.filter(log => log.type === 'whatsapp').length,
      totalSMS: journey.communicationLog.filter(log => log.type === 'sms').length,
      totalDuration: journey.communicationLog
        .filter(log => log.type === 'call' && log.duration)
        .reduce((sum, log) => sum + log.duration, 0)
    };

    return successResponse(res, 'Communication history retrieved', {
      delivery: {
        trackingNumber: journey.deliveryId.trackingNumber,
        recipientName: journey.deliveryId.recipientName,
        recipientPhone: journey.deliveryId.recipientPhone
      },
      summary,
      communicationLog: formattedLog
    });

  } catch (error) {
    console.error('Get Communication History Error:', error.message);
    return errorResponse(res, error.message || 'Failed to get communication history', 500);
  }
};

//  UPLOAD SIGNATURE 
exports.uploadProofSignature = async (req, res) => {
  try {
    const { deliveryId } = req.params;
    const { customerName, customerPhone, latitude, longitude } = req.body;

    if (!req.file) {
      return errorResponse(res, 'Signature image is required', 400);
    }

    const delivery = await Delivery.findById(deliveryId)
      .populate({
        path: 'journeyId',
        select: 'deliveryProof'
      });

    if (!delivery) return errorResponse(res, 'Delivery not found', 404);

    if (delivery.driverId.toString() !== req.user._id.toString()) {
      return errorResponse(res, 'Unauthorized', 403);
    }

    // Allow signature in these statuses
    if (!['picked_up', 'in_transit', 'arrived'].includes(delivery.status)) {
      return errorResponse(res, 'Delivery not in valid state for signature', 400);
    }

    const signatureUrl = `/uploads/signatures/${req.file.filename}`;

    // Update delivery proof
    delivery.deliveryProof = delivery.deliveryProof || {};
    delivery.deliveryProof.signature = signatureUrl;
    delivery.deliveryProof.signedBy = customerName || delivery.recipientName || 'Customer';
    delivery.deliveryProof.signedAt = new Date();
    delivery.deliveryProof.customerPhone = customerPhone || delivery.recipientPhone;

    if (latitude && longitude) {
      delivery.deliveryProof.location = {
        latitude: Number(latitude),
        longitude: Number(longitude)
      };
    }

    // Update status
    delivery.status = 'signature_obtained';
    await delivery.save();

    // Update journey proof
    if (delivery.journeyId) {
      delivery.journeyId.deliveryProof = delivery.journeyId.deliveryProof || {};
      delivery.journeyId.deliveryProof.signature = signatureUrl;
      delivery.journeyId.deliveryProof.signedBy = delivery.deliveryProof.signedBy;
      delivery.journeyId.deliveryProof.signedAt = new Date();
      await delivery.journeyId.save();
    }

    return successResponse(res, 'Customer signature uploaded successfully!', {
      signatureUrl,
      nextStep: 'upload-proof-photos',
      message: 'Now upload delivery proof photos'
    });

  } catch (error) {
    console.error('Upload Signature Error:', error);
    return errorResponse(res, 'Failed to upload signature', 500);
  }
};
// POST /api/delivery/:deliveryId/proof-photos
exports.uploadProofPhotos = async (req, res) => {
  try {
    const { deliveryId } = req.params;

    if (!req.files || req.files.length === 0) {
      return errorResponse(res, 'At least one proof photo is required', 400);
    }

    const delivery = await Delivery.findById(deliveryId);
    if (!delivery) return errorResponse(res, 'Delivery not found', 404);

    if (delivery.driverId.toString() !== req.user._id.toString()) {
      return errorResponse(res, 'Unauthorized', 403);
    }

    if (delivery.status !== 'signature_obtained') {
      return errorResponse(res, 'Signature must be uploaded first', 400);
    }

    const photoUrls = req.files.map(file => `/uploads/proof/${file.filename}`);

    delivery.deliveryProof = delivery.deliveryProof || {};
    delivery.deliveryProof.photos = photoUrls;
    delivery.deliveryProof.photosTakenAt = new Date();

    await delivery.save();

    // Update journey
    if (delivery.journeyId) {
      delivery.journeyId.deliveryProof.photos = photoUrls;
      await delivery.journeyId.save();
    }

    return successResponse(res, 'Proof photos uploaded successfully!', {
      photoUrls,
      nextStep: 'complete-delivery',
      message: 'All proofs collected. Ready to complete delivery!'
    });

  } catch (error) {
    console.error('Upload Proof Photos Error:', error);
    return errorResponse(res, 'Failed to upload proof photos', 500);
  }
};

// POST /api/journey/:journeyId/complete-delivery
exports.completeDelivery = async (req, res) => {
  try {
    const { journeyId } = req.params;
    const { latitude, longitude, finalRemarks, verificationMethod = 'signature' } = req.body;

    if (!latitude || !longitude) {
      return errorResponse(res, 'Location is required to complete delivery', 400);
    }

    const journey = await Journey.findById(journeyId)
      .populate('deliveryId');

    if (!journey) return errorResponse(res, 'Journey not found', 404);

    if (journey.driverId.toString() !== req.user._id.toString()) {
      return errorResponse(res, 'Unauthorized', 403);
    }

    const delivery = journey.deliveryId;
    if (!delivery.deliveryProof?.signature || !delivery.deliveryProof?.photos?.length) {
      return errorResponse(res, 'Signature and proof photos are required', 400);
    }

    // Final update
    delivery.status = 'delivered';
    delivery.actualDeliveryTime = new Date();
    delivery.deliveryProof.completedAt = new Date();
    delivery.deliveryProof.verificationMethod = verificationMethod;
    delivery.deliveryProof.finalLocation = {
      latitude: Number(latitude),
      longitude: Number(longitude)
    };
    await delivery.save();

    // Complete journey
    journey.status = 'completed';
    journey.endTime = new Date();
    journey.endLocation = {
      coordinates: { latitude: Number(latitude), longitude: Number(longitude) },
      address: finalRemarks || 'Delivery completed'
    };
    journey.finalRemarks = finalRemarks || 'Delivery completed successfully';
    await journey.save();

    // Driver free
    await Driver.findByIdAndUpdate(req.user._id, {
      isAvailable: true,
      currentJourney: null
    });

    return successResponse(res, 'Delivery completed successfully!', {
      message: 'Thank you! You are now available for new deliveries.',
      deliveryStatus: 'delivered',
      journeyStatus: 'completed',
      proof: {
        signature: delivery.deliveryProof.signature,
        photos: delivery.deliveryProof.photos,
        signedBy: delivery.deliveryProof.signedBy,
        verificationMethod
      }
    });

  } catch (error) {
    console.error('Complete Delivery Error:', error);
    return errorResponse(res, 'Failed to complete delivery', 500);
  }
};

//  END JOURNEY 
exports.endJourney = async (req, res) => {
  try {
    const { journeyId } = req.params;
    const { latitude, longitude, address, finalRemarks } = req.body;

    if (!latitude || !longitude) {
      return errorResponse(res, 'End location (latitude & longitude) is required', 400);
    }

    const journey = await Journey.findById(journeyId);
    if (!journey) {
      return errorResponse(res, 'Journey not found', 404);
    }

    const driver = req.user;

    if (journey.driverId.toString() !== driver._id.toString()) {
      return errorResponse(res, 'Unauthorized: This journey does not belong to you', 403);
    }

    if (['completed', 'cancelled'].includes(journey.status)) {
      return errorResponse(res, 'Journey already ended', 400);
    }

    // Calculate total distance (your existing logic - unchanged)
    let totalDistance = 0;

    if (journey.waypoints && journey.waypoints.length > 0) {
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

    // Duration & Speed
    const endTime = new Date();
    const durationMs = endTime - new Date(journey.startTime);
    const durationMinutes = Math.round(durationMs / 60000);
    const durationHours = durationMinutes / 60;
    const averageSpeed = durationHours > 0 ? totalDistance / durationHours : 0;

    // Update Journey
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

    // Update Delivery
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

    // Update driver availability
    await Driver.findByIdAndUpdate(
      driver._id,
      {
        isAvailable: true,
        currentJourney: null,
        $unset: { activeDelivery: "" }
      },
      { new: true }
    );

    // SAFE: Add null checks for communicationLog, images, waypoints
    const communicationLog = journey.communicationLog || [];
    const images = journey.images || [];
    const waypoints = journey.waypoints || [];

    return successResponse(res, 'Journey ended successfully! You are now free for new deliveries', {
      journey: {
        id: journey._id,
        status: journey.status,
        totalDistance: journey.totalDistance + ' km',
        totalDuration: journey.totalDuration + ' mins',
        averageSpeed: journey.averageSpeed + ' km/h',
        totalCheckpoints: waypoints.length,
        totalImages: images.length,
        totalCalls: communicationLog.filter(log => log.type === 'call').length,
        totalWhatsApp: communicationLog.filter(log => log.type === 'whatsapp').length
      },
      driverStatus: 'Available',
      deliveryStatus: delivery?.status || 'delivered'
    });

  } catch (error) {
    console.error('End Journey Error:', error.message);
    return errorResponse(res, error.message || 'Failed to end journey', 500);
  }
};

//  GET ACTIVE JOURNEY 
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

    // Calculate communication summary
    const communicationSummary = {
      totalCalls: journey.communicationLog?.filter(log => log.type === 'call').length || 0,
      totalWhatsApp: journey.communicationLog?.filter(log => log.type === 'whatsapp').length || 0,
      lastCall: journey.communicationLog?.filter(log => log.type === 'call').pop() || null,
      lastWhatsApp: journey.communicationLog?.filter(log => log.type === 'whatsapp').pop() || null
    };

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
      communication: communicationSummary,
      recordings: journey.recordings?.map((rec, idx) => ({
        index: idx + 1,
        type: rec.type,
        url: rec.url,
        timestamp: rec.timestamp
      })) || [],
      totalCheckpoints: journey.waypoints?.length || 0,
      totalImages: journey.images?.length || 0,
      totalRecordings: journey.recordings?.length || 0
    };

    return successResponse(res, 'Active journey retrieved successfully', response);

  } catch (error) {
    console.error('Get Active Journey Error:', error.message);
    return errorResponse(res, 'Failed to retrieve active journey', 500);
  }
};

//  GET JOURNEY DETAILS 
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
      })) || [],
      communications: journey.communicationLog?.map((comm, idx) => ({
        number: idx + 1,
        type: comm.type,
        contactName: comm.contactName,
        phoneNumber: comm.phoneNumber,
        timestamp: comm.timestamp,
        duration: comm.duration,
        status: comm.status
      })) || [],
      recordings: journey.recordings?.map((rec, idx) => ({
        number: idx + 1,
        type: rec.type,
        url: rec.url,
        timestamp: rec.timestamp,
        fileSize: rec.fileSize
      })) || [],
      navigation: journey.navigationHistory?.map((nav, idx) => ({
        number: idx + 1,
        destination: nav.destination,
        startedAt: nav.startedAt,
        completedAt: nav.completedAt,
        app: nav.navigationApp,
        estimatedDistance: nav.estimatedDistance,
        estimatedDuration: nav.estimatedDuration
      })) || []
    };

    return successResponse(res, 'Journey details retrieved successfully', response);

  } catch (error) {
    console.error('Get Journey Details Error:', error.message);
    return errorResponse(res, 'Failed to retrieve journey details', 500);
  }
};

//  DRIVER JOURNEY HISTORY 
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
      .select('status startTime endTime totalDistance totalDuration averageSpeed waypoints images communicationLog recordings')
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
      totalImages: j.images?.length || 0,
      totalCalls: j.communicationLog?.filter(log => log.type === 'call').length || 0,
      totalWhatsApp: j.communicationLog?.filter(log => log.type === 'whatsapp').length || 0,
      totalRecordings: j.recordings?.length || 0
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

//  CANCEL JOURNEY 
exports.cancelJourney = async (req, res) => {
  try {
    const { journeyId } = req.params;
    const { reason, latitude, longitude } = req.body;

    if (!reason) {
      return errorResponse(res, 'Cancellation reason is required', 400);
    }

    const driver = req.user;
    const journey = await Journey.findById(journeyId);

    if (!journey) {
      return errorResponse(res, 'Journey not found', 404);
    }

    if (journey.driverId.toString() !== driver._id.toString()) {
      return errorResponse(res, 'Unauthorized', 403);
    }

    if (!journey.isActive()) {
      return errorResponse(res, 'Journey is not active', 400);
    }

    // Update journey status
    journey.status = 'cancelled';
    journey.endTime = new Date();
    journey.finalRemarks = `Cancelled: ${reason}`;

    if (latitude && longitude) {
      journey.endLocation = {
        coordinates: { latitude: Number(latitude), longitude: Number(longitude) },
        address: 'Journey cancelled here'
      };
    }

    await journey.save();

    // Update delivery status
    const delivery = await Delivery.findById(journey.deliveryId);
    if (delivery) {
      delivery.status = 'cancelled';
      await delivery.save();

      await DeliveryStatusHistory.create({
        deliveryId: delivery._id,
        status: 'cancelled',
        location: {
          coordinates: {
            latitude: Number(latitude) || 0,
            longitude: Number(longitude) || 0
          },
          address: 'Journey cancelled'
        },
        remarks: `Journey cancelled by driver: ${reason}`,
        updatedBy: {
          userId: driver._id,
          userRole: 'driver',
          userName: driver.name
        }
      });
    }

    // Update driver status
    await Driver.findByIdAndUpdate(
      driver._id,
      {
        isAvailable: true,
        currentJourney: null,
        $unset: { activeDelivery: "" }
      }
    );

    return successResponse(res, 'Journey cancelled successfully', {
      journeyId: journey._id,
      status: journey.status,
      reason: journey.finalRemarks,
      driverStatus: 'Available'
    });

  } catch (error) {
    console.error('Cancel Journey Error:', error.message);
    return errorResponse(res, error.message || 'Failed to cancel journey', 500);
  }
};


