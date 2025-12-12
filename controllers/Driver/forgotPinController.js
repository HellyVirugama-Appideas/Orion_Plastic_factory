// const Driver = require('../../models/Driver');
// const { successResponse, errorResponse } = require('../../utils/responseHelper');
// const bcrypt = require('bcryptjs');

// // In-memory session (production mein Redis ya DB use karna)
// const Sessions = {};

// // 1. Phone + Emirates → OTP 
// exports.sendPinResetOtp = async (req, res) => {
//   try {
//     const { phone, emiratesId } = req.body;

//     if (!phone || !emiratesId) {
//       return errorResponse(res, 'Phone number and Emirates ID are required', 400);
//     }

//     if (!/^[0-9]{10}$/.test(phone)) {
//       return errorResponse(res, 'Valid 10-digit phone number required', 400);
//     }

//     const driver = await Driver.findOne({
//       phone: phone.trim(),
//       'governmentIds.emiratesId': emiratesId.trim(),
//       profileStatus: 'approved'
//     });

//     if (!driver) {
//       return errorResponse(res, 'No approved driver found with these details', 404);
//     }

//     // Generate 4-digit OTP
//     const otp = Math.floor(1000 + Math.random() * 9000).toString();
//     const otpExpires = Date.now() + 5 * 60 * 1000; // 5 min

//     Sessions[driver._id.toString()] = {
//       otp,
//       otpExpires,
//       phone,
//       emiratesId,
//       verified: false,
//       newPin: null
//     };

//     console.log(`PIN Reset OTP → ${driver.name} (${phone}): ${otp}`);

//     // TODO: Real SMS bhejo
//     // await sendSMS(phone, `Your PIN reset code is ${otp}. Valid for 5 minutes.`);

//     return successResponse(res, 'OTP sent successfully!', {
//       driverId: driver._id,
//       name: driver.name,
//       otp : otp,
//       maskedPhone: phone.replace(/(\d{6})\d{4}/, '$1****')
//     });

//   } catch (error) {
//     console.error('Send OTP Error:', error);
//     return errorResponse(res, 'Server error', 500);
//   }
// };

// // 2. OTP Verify
// exports.verifyPinResetOtp = async (req, res) => {
//   try {
//     const { driverId, otp } = req.body;

//     const session = Sessions[driverId];
//     if (!session || session.otp !== otp || Date.now() > session.otpExpires) {
//       return errorResponse(res, 'Invalid or expired OTP', 400);
//     }

//     session.verified = true;
//     Sessions[driverId] = session;

//     return successResponse(res, 'OTP verified!', {
//       message: 'Now create your new 4-digit PIN'
//     });

//   } catch (error) {
//     return errorResponse(res, 'Verification failed', 500);
//   }
// };

// // 3. Set New PIN
// exports.setNewPin = async (req, res) => {
//   try {
//     const { driverId, newPin } = req.body;

//     if (!/^\d{4}$/.test(newPin)) {
//       return errorResponse(res, 'PIN must be exactly 4 digits', 400);
//     }

//     const session = Sessions[driverId];
//     if (!session || !session.verified) {
//       return errorResponse(res, 'Session expired. Please try again.', 400);
//     }

//     session.newPin = newPin;
//     Sessions[driverId] = session;

//     return successResponse(res, 'PIN received', {
//       message: 'Now confirm your new PIN'
//     });

//   } catch (error) {
//     return errorResponse(res, 'Failed', 500);
//   }
// };

// // 4. Confirm PIN → Final Save
// exports.confirmNewPin = async (req, res) => {
//   try {
//     const { driverId, confirmPin } = req.body;

//     const session = Sessions[driverId];
//     if (!session || !session.verified || !session.newPin) {
//       return errorResponse(res, 'Invalid session. Start again.', 400);
//     }

//     if (session.newPin !== confirmPin) {
//       return errorResponse(res, 'PINs do not match', 400);
//     }

//     const driver = await Driver.findById(driverId);
//     if (!driver) return errorResponse(res, 'Driver not found', 404);

//     // Hash & Save New PIN
//     const salt = await bcrypt.genSalt(10);
//     driver.pin = await bcrypt.hash(confirmPin, salt);
//     driver.pinAttempts = 0;
//     driver.pinLockedUntil = null;
//     await driver.save();

//     // Clear session
//     delete Sessions[driverId];

//     return successResponse(res, 'PIN changed successfully!', {
//       message: 'You can now login with your new PIN'
//     });

//   } catch (error) {
//     console.error('Confirm PIN Error:', error);
//     return errorResponse(res, 'PIN reset failed', 500);
//   }
// };

const Driver = require('../../models/Driver');
const Session = require('../../models/Session');
const { successResponse, errorResponse } = require('../../utils/responseHelper');
const bcrypt = require('bcryptjs');


exports.sendPinResetOtp = async (req, res) => {
  try {
    const { phone, emiratesId } = req.body;

    if (!phone || !emiratesId) {
      return errorResponse(res, 'Phone number and Emirates ID are required', 400);
    }

    if (!/^[0-9]{10}$/.test(phone)) {
      return errorResponse(res, 'Valid 10-digit phone number required', 400);
    }

    const driver = await Driver.findOne({
      phone: phone.trim(),
      'governmentIds.emiratesId': emiratesId.trim(),
      profileStatus: 'approved'
    });

    if (!driver) {
      return errorResponse(res, 'No approved driver found with these details', 404);
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    await Session.findOneAndUpdate(
      { driverId: driver._id },
      {
        driverId: driver._id,
        otp,
        otpExpires: Date.now() + 5 * 60 * 1000,
        verified: false,
        newPin: null
      },
      { upsert: true, setDefaultsOnInsert: true }
    );

    console.log(`PIN Reset OTP → ${driver.name} (${phone}): ${otp}`);

    return successResponse(res, 'OTP sent successfully!', {
      driverId: driver._id,
      name: driver.name,
      otp: otp,
      maskedPhone: phone.replace(/(\d{6})\d{4}/, '$1****') 
    });

  } catch (error) {
    console.error('Send OTP Error:', error);
    return errorResponse(res, 'Server error', 500);
  }
};

exports.verifyPinResetOtp = async (req, res) => {
  try {
    const { driverId, otp } = req.body;

    const session = await Session.findOne({ driverId });
    if (!session || session.otp !== otp || Date.now() > session.otpExpires) {
      return errorResponse(res, 'Invalid or expired OTP', 400);
    }

    session.verified = true;
    await session.save();

    return successResponse(res, 'OTP verified!', {
      message: 'Now create your new 4-digit PIN'
    });

  } catch (error) {
    return errorResponse(res, 'Verification failed', 500);
  }
};

exports.setNewPin = async (req, res) => {
  try {
    const { driverId, newPin } = req.body;

    if (!/^\d{4}$/.test(newPin)) {
      return errorResponse(res, 'PIN must be exactly 4 digits', 400);
    }

    const session = await Session.findOne({ driverId });
    if (!session || !session.verified) {
      return errorResponse(res, 'Session expired. Please try again.', 400);
    }

    session.newPin = newPin;
    await session.save();

    return successResponse(res, 'PIN received', {
      message: 'Now confirm your new PIN'
    });

  } catch (error) {
    return errorResponse(res, 'Failed', 500);
  }
};

exports.confirmNewPin = async (req, res) => {
  try {
    const { driverId, confirmPin } = req.body;

    const session = await Session.findOne({ driverId });
    if (!session || !session.verified || !session.newPin) {
      return errorResponse(res, 'Invalid session. Start again.', 400);
    }

    if (session.newPin !== confirmPin) {
      return errorResponse(res, 'PINs do not match', 400);
    }
    const driver = await Driver.findById(driverId);
    if (!driver) return errorResponse(res, 'Driver not found', 404);

    const salt = await bcrypt.genSalt(10);
    driver.pin = await bcrypt.hash(confirmPin, salt);
    driver.pinAttempts = 0;
    driver.pinLockedUntil = null;
    await driver.save();

    await Session.deleteOne({ driverId });

    return successResponse(res, 'PIN changed successfully!', {
      message: 'You can now login with your new PIN'
    });

  } catch (error) {
    console.error('Confirm PIN Error:', error);
    return errorResponse(res, 'PIN reset failed', 500);
  }
};
