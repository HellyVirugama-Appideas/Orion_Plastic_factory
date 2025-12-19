// // models/Session.js  (ya PinSession.js)

// const mongoose = require('mongoose');

// const sessionSchema = new mongoose.Schema({
//   driverId: {
//     type: mongoose.Schema.Types.ObjectId,
//     // ref: 'Driver',
//     required: true,
//     unique: true
//   },
//   type: {
//     type: String,
//     required: true
//   },
//   otp: { type: String },                    // only for forgot_pin
//   otpExpires: { type: Date },               // only for forgot_pin
//   oldPinVerified: { type: Boolean, default: false }, // only for change_pin
//   newPin: { type: String },               // common
//   verified: { type: Boolean, default: false }, // for forgot_pin OTP verify

//   userType: {
//     type: String,
//     required: true,
//     enum: ['driver', 'admin']
//   },
//   token: {
//     type: String,
//     required: true
//   },
//   deviceInfo: {
//     type: String,
//     default: 'Unknown'
//   },
// }, { timestamps: true });

// // 24 hours ->  delete
// sessionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

// module.exports = mongoose.model('Session', sessionSchema);

const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    // ref: 'Driver',
    required: false,                 // ← YE CHANGE: true se false
    unique: true
  },
  type: {
    type: String,
    required: false                  // ← YE CHANGE: function hata ke false
  },
  otp: { type: String },
  otpExpires: { type: Date },
  oldPinVerified: { type: Boolean, default: false },
  newPin: { type: String },
  verified: { type: Boolean, default: false },

  userType: {
    type: String,
    enum: ['driver', 'admin'],
    required: function() { 
      return this.token !== undefined; 
    }
  },
  token: {
    type: String,
    required: function() { 
      return this.type === undefined || this.type.includes('login'); 
    }
  },
  deviceInfo: {
    type: String,
    default: 'Unknown'
  },
  ipAddress: { type: String }, 
  expiresAt: { type: Date }   
}, { timestamps: true });

sessionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

module.exports = mongoose.model('Session', sessionSchema);