// const mongoose = require('mongoose');

// const sessionSchema = new mongoose.Schema({
//   driverId: {
//     type: mongoose.Schema.Types.ObjectId,
//     // ref: 'Driver',
//     required: false,               
//     unique: true
//   },
//   type: {
//     type: String,
//     required: false               
//   },
//   otp: { type: String },
//   otpExpires: { type: Date },
//   oldPinVerified: { type: Boolean, default: false },
//   newPin: { type: String },
//   verified: { type: Boolean, default: false },

//   userType: {
//     type: String,
//     enum: ['driver', 'admin'],
//     required: function() { 
//       return this.token !== undefined; 
//     }
//   },
//   token: {
//     type: String,
//     required: function() { 
//       return this.type === undefined || this.type.includes('login'); 
//     }
//   },
//   deviceInfo: {
//     type: String,
//     default: 'Unknown'
//   },
//   ipAddress: { type: String }, 
//   expiresAt: { type: Date }   
// }, { timestamps: true });

// sessionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

// module.exports = mongoose.model('Session', sessionSchema);

const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    required: true,                // Now required for proper querying
    index: true                    // Indexed for performance
  },
  type: {
    type: String,
    required: true,                // 'login' or 'forgot_pin' — always set
    enum: ['login', 'forgot_pin'], // Explicit allowed types
    index: true
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
      return this.type === 'login'; 
    }
  },
  token: {
    type: String,
    sparse: true,                  
    unique: true,                  
    required: function() { 
      return this.type === 'login'; 
    }
  },
  deviceInfo: {
    type: String,
    default: 'Unknown'
  },
  ipAddress: { type: String }, 
  expiresAt: { type: Date }   
}, { 
  timestamps: true 
});

sessionSchema.index({ driverId: 1, type: 1 }, { unique: true });

sessionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

sessionSchema.index({ otpExpires: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Session', sessionSchema);