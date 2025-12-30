const Driver = require("../../models/Driver");

// const getVehicle = async (req, res) => {
//   try {
//     const { driverId } = req.params;

//     const driver = await Driver.findById(driverId).select("vehicleNumber");

//     if (!driver) {
//       return res.status(404).json({
//         success: false,
//         message: "Driver not found",
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       vehicleNumber: driver.vehicleNumber,
//     });

//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };


const getVehicle = async (req, res) => {
  try {
    // driver id coming from token (auth middleware)
    const driverId = req.user.id || req.user._id;

    const driver = await Driver.findById(driverId).select(
      "name mobile vehicleNumber"
    );

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: "Driver not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        driverId: driver._id,
        name: driver.name,
        mobile: driver.mobile,
        vehicleNumber: driver.vehicleNumber,
      },
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};



module.exports = { getVehicle };
