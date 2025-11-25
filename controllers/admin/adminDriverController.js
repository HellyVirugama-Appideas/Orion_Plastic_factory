const Driver = require('../../models/Driver');
const Vehicle = require("../../models/Vehicle")
const { successResponse, errorResponse } = require('../../utils/responseHelper');

//ASSIGN VEHICLE TO DRIVER
// exports.assignVehicle = async (req, res) => {
//   try {
//     console.log("req.user:", req.user); 

//     if (!req.user) {
//       return errorResponse(res, 'Unauthorized: Admin not logged in', 401);
//     } 

//     const { driverId } = req.params;
//     const { vehicleType, vehicleNumber, vehicleModel, vehicleColor } = req.body;

//     if (!vehicleType || !vehicleNumber) {
//       return errorResponse(res, 'Vehicle type and vehicle number are required', 400);
//     }

//     const validVehicleTypes = ['car', 'bike', 'auto', 'truck', 'van'];
//     if (!validVehicleTypes.includes(vehicleType)) {
//       return errorResponse(res, 'Invalid vehicle type', 400);
//     }

//     const driver = await Driver.findById(driverId);
//     if (!driver) {
//       return errorResponse(res, 'Driver not found', 404);
//     }

//     const existingVehicle = await Driver.findOne({
//       vehicleNumber: vehicleNumber.toUpperCase().trim(),
//       _id: { $ne: driverId }
//     });

//     if (existingVehicle) {
//       return errorResponse(res, 'Vehicle number already assigned to another driver', 400);
//     }

//     driver.vehicleType = vehicleType;
//     driver.vehicleNumber = vehicleNumber.toUpperCase().trim();
//     driver.vehicleModel = vehicleModel || null;
//     driver.vehicleColor = vehicleColor || null;
//     driver.vehicleAssignedBy = req.user._id;
//     driver.vehicleAssignedAt = new Date();

//     if (driver.profileStatus === 'incomplete') {
//       driver.profileStatus = 'pending_verification';
//     }

//     await driver.save(); 

//     return successResponse(res, 'Vehicle assigned successfully!', {
//       driver: {
//         id: driver._id,
//         name: driver.name,
//         phone: driver.phone,
//         vehicleNumber: driver.vehicleNumber,
//         vehicleType: driver.vehicleType,
//         profileStatus: driver.profileStatus
//       }
//     });

//   } catch (error) {
//     console.error('Assign Vehicle Error:', error.message);
//     console.error('Full Error:', error); 
//     return errorResponse(res, 'Failed to assign vehicle: ' + error.message, 500);
//   }
// };

exports.assignVehicle = async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const { driverId } = req.body;

    if (!driverId) {
      return errorResponse(res, 'driverId is required', 400);
    }

    const vehicle = await Vehicle.findById(vehicleId);
    const driver = await Driver.findById(driverId);

    if (!vehicle) return errorResponse(res, 'Vehicle not found', 404);
    if (!driver) return errorResponse(res, 'Driver not found', 404);

    // Vehicle already assigned?
    if (vehicle.assignedTo) {
      return errorResponse(res, `Vehicle already assigned to ${vehicle.assignedTo.name || 'another driver'}`, 400);
    }

    // Driver already has vehicle?
    if (driver.vehicle) {
      return errorResponse(res, 'Driver already has a vehicle assigned', 400);
    }


    vehicle.assignedTo = driver._id;
    vehicle.assignedBy = req.user._id;
    vehicle.assignedAt = new Date();
    vehicle.status = 'assigned';

    driver.vehicle = vehicle._id;  

    await Promise.all([vehicle.save(), driver.save()]);

    await vehicle.populate('assignedTo', 'name phone');

    return successResponse(res, 'Vehicle assigned to driver successfully!', {
      vehicle: {
        _id: vehicle._id,
        vehicleNumber: vehicle.vehicleNumber,
        status: vehicle.status,
        assignedTo: vehicle.assignedTo.name
      },
      driver: {
        _id: driver._id,
        name: driver.name,
        phone: driver.phone,
        assignedVehicle: vehicle.vehicleNumber
      }
    });

  } catch (error) {
    console.error('Assign Vehicle Error:', error);
    return errorResponse(res, 'Failed to assign vehicle', 500);
  }
};

//  UPDATE VEHICLE DETAILS
exports.updateVehicle = async (req, res) => {
  try {
    const { driverId } = req.params;
    const { vehicleType, vehicleNumber, vehicleModel, vehicleColor } = req.body;

    const driver = await Driver.findById(driverId);
    if (!driver) {
      return errorResponse(res, 'Driver not found', 404);
    }

    // Check if new vehicle number is already assigned
    if (vehicleNumber && vehicleNumber !== driver.vehicleNumber) {
      const existingVehicle = await Driver.findOne({
        vehicleNumber: vehicleNumber.toUpperCase(),
        _id: { $ne: driverId }
      });

      if (existingVehicle) {
        return errorResponse(res, 'Vehicle number is already assigned to another driver', 400);
      }
    }

    // Update fields
    if (vehicleType) driver.vehicleType = vehicleType;
    if (vehicleNumber) driver.vehicleNumber = vehicleNumber.toUpperCase();
    if (vehicleModel !== undefined) driver.vehicleModel = vehicleModel;
    if (vehicleColor !== undefined) driver.vehicleColor = vehicleColor;

    await driver.save();

    return successResponse(res, 'Vehicle details updated successfully', {
      driver: {
        id: driver._id,
        name: driver.name,
        vehicleType: driver.vehicleType,
        vehicleNumber: driver.vehicleNumber,
        vehicleModel: driver.vehicleModel,
        vehicleColor: driver.vehicleColor
      }
    });

  } catch (error) {
    console.error('Update Vehicle Error:', error);
    return errorResponse(res, 'Failed to update vehicle details', 500);
  }
};

// REMOVE VEHICLE ASSIGNMENT 

exports.removeVehicle = async (req, res) => {
  try {
    const { driverId } = req.params;
    const { reason } = req.body;

    const driver = await Driver.findById(driverId);
    if (!driver) {
      return errorResponse(res, 'Driver not found', 404);
    }

    if (!driver.vehicleNumber) {
      return errorResponse(res, 'No vehicle assigned to this driver', 400);
    }

    // Remove vehicle assignment
    driver.vehicleType = null;
    driver.vehicleNumber = null;
    driver.vehicleModel = null;
    driver.vehicleColor = null;
    driver.vehicleAssignedBy = null;
    driver.vehicleAssignedAt = null;
    driver.isAvailable = false; // Force offline when vehicle removed

    // Update profile status
    if (driver.profileStatus === 'approved') {
      driver.profileStatus = 'incomplete';
    }

    await driver.save();

    return successResponse(res, 'Vehicle assignment removed successfully', {
      driver: {
        id: driver._id,
        name: driver.name,
        profileStatus: driver.profileStatus
      },
      reason: reason || 'No reason provided'
    });

  } catch (error) {
    console.error('Remove Vehicle Error:', error);
    return errorResponse(res, 'Failed to remove vehicle assignment', 500);
  }
};

// GET DRIVERS WITHOUT VEHICLE 
exports.getDriversWithoutVehicle = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = {
      $or: [
        { vehicleNumber: null },
        { vehicleNumber: '' },
        { vehicleType: null }
      ],
      isActive: true
    };

    const [drivers, total] = await Promise.all([
      Driver.find(query)
        .select('name email phone licenseNumber profileStatus createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Driver.countDocuments(query)
    ]);

    return successResponse(res, 'Drivers without vehicle retrieved successfully', {
      drivers,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get Drivers Without Vehicle Error:', error);
    return errorResponse(res, 'Failed to retrieve drivers', 500);
  }
};

module.exports = exports;