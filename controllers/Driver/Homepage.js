const Vehicle = require('../../models/Vehicle');
const Driver = require('../../models/Driver');

exports.getVehicle = async (req, res) => {
  try {
    const driverId = req.user.id || req.user._id;

    const driver = await Driver.findById(driverId).select("name mobile vehicleNumber");

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: "Driver not found",
      });
    }

    // Fetch admin-assigned vehicle – relaxed filters
    const assignedVehicle = await Vehicle.findOne({
      assignedTo: driverId,  // ← Only this is important
    })
      .select('vehicleNumber registrationNumber model vehicleType status assignedAt')
      .populate('assignedTo', 'name phone'); // optional

    if (!assignedVehicle) {
      return res.status(200).json({
        success: true,
        message: "No vehicle currently assigned by admin",
        data: {
          driverId: driver._id,
          name: driver.name,
          mobile: driver.mobile,
          vehicleNumber: null,
        }
      });
    }

    return res.status(200).json({
      success: true,
      message: "Assigned vehicle found",
      data: {
        driverId: driver._id,
        name: driver.name,
        mobile: driver.mobile,
        vehicleNumber: assignedVehicle.vehicleNumber,
        model : assignedVehicle.model,
        registrationNumber: assignedVehicle.registrationNumber,
        vehicleType: assignedVehicle.vehicleType,
        status: assignedVehicle.status,
        assignedAt: assignedVehicle.assignedAt
      }
    });

  } catch (error) {
    console.error('Get Vehicle Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};