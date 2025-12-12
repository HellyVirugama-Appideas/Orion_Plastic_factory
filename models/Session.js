// models/Session.js  (ya PinSession.js)

const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    required: true,
    unique: true
  },
  type: {
    type: String,
    enum: ['forgot_pin', 'change_pin'],
    required: true
  },
  otp: { type: String },                    // only for forgot_pin
  otpExpires: { type: Date },               // only for forgot_pin
  oldPinVerified: { type: Boolean, default: false }, // only for change_pin
  newPin: { type: String },               // common
  verified: { type: Boolean, default: false } // for forgot_pin OTP verify
}, { timestamps: true });

// 24 hours ->  delete
sessionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

module.exports = mongoose.model('Session', sessionSchema);