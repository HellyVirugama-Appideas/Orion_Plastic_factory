// const mongoose = require('mongoose');
// const bcrypt = require('bcryptjs');

// const driverSchema = new mongoose.Schema({
//   name: {
//     type: String,
//     required: [true, 'Name is required'],
//     trim: true
//   },
//   email: {
//     type: String,
//     required: [true, 'Email is required'], 
//     unique: true,
//     lowercase: true,
//     match: [/^\S+@\S+\.\S+$/, 'Valid email required']
//   },
//   phone: {
//     type: String,
//     required: [true, 'Phone is required'],
//     unique: true,
//     match: [/^[0-9]{10}$/, '10 digit phone number required']
//   },
//   password: {
//     type: String,
//     required: [true, 'Password is required'],
//     minlength: [6, 'Password minimum 6 characters']
//   },
//   role: {
//     type: String,
//     default: 'driver',
//     enum: ['driver']  
//   },

//   // Driver specific fields
//   licenseNumber: { 
//     type: String, 
//     required: [true, 'License number is required'], 
//     unique: true,
//     uppercase: true
//   },

//   // Vehicle details - ASSIGNED BY ADMIN (not required at signup)
//   vehicleType: { 
//     type: String, 
//     enum: ['car', 'bike', 'auto', 'truck', 'van'],
//     default: null
//   },
//   vehicleNumber: { 
//     type: String, 
//     unique: true, 
//     sparse: true, 
//     uppercase: true 
//   },
//   vehicleModel: { type: String, default: null },
//   vehicleColor: { type: String, default: null },
//   vehicleAssignedBy: { 
//     type: mongoose.Schema.Types.ObjectId, 
//     ref: 'admin',
//     default: null 
//   },
//   vehicleAssignedAt: { type: Date, default: null },

//   // PIN for app access
//   pin: { 
//     type: String, 
//     required: [true, 'PIN is required']
//   },

//   // Profile status
//   profileStatus: {
//     type: String,
//     enum: ['incomplete', 'pending_verification', 'approved', 'rejected'],
//     default: 'incomplete'
//   },
//   rejectionReason: { type: String, default: null },

//   // Availability
//   isAvailable: { type: Boolean, default: false },
//   isActive: { type: Boolean, default: true },
//   isVerified: { type: Boolean, default: false },

//   // Profile
//   profileImage: { type: String, default: null },
//   rating: { type: Number, default: 0, min: 0, max: 5 },
//   totalRides: { type: Number, default: 0 },

//   // Documents array
//   documents: [{
//     documentType: {
//       type: String,
//       required: true,
//       enum: [
//         'aadhaar_front',
//         'aadhaar_back',
//         'license_front',
//         'license_back',
//         'pan_card',
//         'vehicle_rc',
//         'vehicle_insurance',
//         'police_verification',
//         'fitness_certificate',
//         'permit',
//         'profile_photo',
//         'other'
//       ]
//     },
//     fileUrl: { type: String, required: true },
//     documentNumber: { type: String },
//     expiryDate: { type: Date },
//     status: {
//       type: String,
//       enum: ['pending', 'verified', 'rejected'],
//       default: 'pending'
//     },
//     verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
//     verifiedAt: { type: Date },
//     rejectionReason: { type: String },
//     uploadedAt: { type: Date, default: Date.now }
//   }],

//   // PIN management
//   pinAttempts: { type: Number, default: 0 },
//   pinLockedUntil: { type: Date },

//   // Password reset
//   resetPasswordToken: String,
//   resetPasswordExpires: Date,

//   // PIN reset
//   resetPinToken: String,
//   resetPinExpires: Date,

// }, { timestamps: true });

// // Indexes
// driverSchema.index({ email: 1 }, { unique: true });
// driverSchema.index({ phone: 1 }, { unique: true });
// driverSchema.index({ licenseNumber: 1 }, { unique: true });
// driverSchema.index({ vehicleNumber: 1 }, { sparse: true }); // sparse index allows null

// // Pre-save middleware
// driverSchema.pre('save', async function (next) {
//   // Hash password if modified
//   if (this.isModified('password') && this.password) {
//     if (this.password.length < 60) { // if plain text
//       this.password = await bcrypt.hash(this.password, 10);
//     }
//   }

//   // Hash PIN if modified
//   if (this.isModified('pin') && this.pin && this.pin.length < 60) {
//     this.pin = await bcrypt.hash(this.pin, 10);
//   }

//   next();
// });

// // Compare password method
// driverSchema.methods.comparePassword = async function (candidatePassword) {
//   return await bcrypt.compare(candidatePassword, this.password);
// };

// // Compare PIN method
// driverSchema.methods.comparePin = async function (candidatePin) {
//   return await bcrypt.compare(candidatePin, this.pin);
// };

// // Remove sensitive data from JSON
// driverSchema.methods.toJSON = function() {
//   const obj = this.toObject();
//   delete obj.password;
//   delete obj.pin;
//   delete obj.resetPasswordToken;
//   delete obj.resetPasswordExpires;
//   delete obj.resetPinToken;
//   delete obj.resetPinExpires;
//   delete obj.pinAttempts;
//   delete obj.pinLockedUntil;
//   return obj;
// };

// module.exports = mongoose.model('Driver', driverSchema);

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const driverSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: [true, 'Phone is required'],
    unique: true,
    trim: true,
    match: [/^\+91[0-9]{10}$/, 'Valid Indian phone number required (+91 followed by 10 digits)']
  },

  countryCode: {
    type: String,
    default: '+91',
    trim: true
  },

  otp: {
    type: String,
    required: false
  },
  // otpExpiresAt: {
  //   type: Date,
  //   required: true,
  //   default: Date.now
  // },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  password: {
    type: String,
    required: [false, 'Password is required'],
    minlength: [6, 'Password minimum 6 characters']
  },
  role: {
    type: String,
    default: 'driver',
    enum: ['driver']
  },
  // ADD THIS — RC Registration Number
  registrationNumber: {
    type: String,
    uppercase: true,
    trim: true,
    sparse: true,
    unique: true,
    default: null,
    match: [/^[A-Z0-9\s-]+$/, 'Invalid registration number format']
  },

  // Driver License
  licenseNumber: {
    type: String,
    required: [true, 'License number is required'],
    unique: true,
    sparse: true,
    uppercase: true
  },

  // Vehicle details - ASSIGNED BY ADMIN
  vehicleType: {
    type: String,
    enum: ['car', 'bike', 'auto', 'truck', 'van', 'tempo'],
    default: null,
    required: false
  },
  vehicleNumber: {
    type: String,
    unique: true,
    sparse: true,
    uppercase: true,
    trim: true,
    unique: true,
    default: null
  },
  vehicleModel: { type: String, default: null },
  vehicleColor: { type: String, default: null },
  vehicleAssignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'admin',
    default: null
  },
  vehicleAssignedAt: { type: Date, default: null },

  // PIN for app access
  pin: {
    type: String,
    // required: [true, 'PIN is required']
  },

  // Profile status
  profileStatus: {
    type: String,
    enum: [
      'incomplete',
      'pending_pin_setup',
      'pending_profile',
      'pending_verification',
      'approved',
      'rejected'
    ],
    default: 'pending_pin_setup'
  },
  rejectionReason: { type: String, default: null },

  // Availability
  isAvailable: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },

  // Profile
  profileImage: { type: String, default: null },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  totalRides: { type: Number, default: 0 },

  // Documents array
  documents: [{
    documentType: {
      type: String,
      required: true,
      enum: ['license_front', 'license_back', 'vehicle_rc_front', 'vehicle_rc_back']
    },
    fileUrl: { type: String, required: true },
    documentNumber: { type: String },
    expiryDate: { type: Date },
    status: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending'
    },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'admin' },
    verifiedAt: { type: Date },
    rejectionReason: { type: String },
    uploadedAt: { type: Date, default: Date.now }
  }],

  // Bank Details (NEW)
  bankDetails: {
    accountHolderName: String,
    accountNumber: String,
    ifscCode: String,
    bankName: String,
    branch: String,
    accountType: {
      type: String,
      enum: ['savings', 'current']
    }
  },

  // Government IDs 
  governmentIds: {
    emiratesId: {
      type: String,
      required: true
    },
    aadhaarNumber: {
      type: String,
      match: [/^\d{12}$/, '12 digit Aadhaar number required']
    },
    panNumber: {
      type: String,
      uppercase: true,
      match: [/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format']
    },
    voterId: String,
    passportNumber: String
  },


  // Address (NEW)
  address: {
    addressLine1: String,
    addressLine2: String,
    city: String,
    state: String,
    zipcode: {
      type: String,
      match: [/^\d{6}$/, '6 digit zipcode required']
    },
    country: {
      type: String,
      default: 'India'
    }
  },

  // Emergency Contact (NEW)
  emergencyContact: {
    name: String,
    relationship: String,
    phone: {
      type: String,
      match: [/^[0-9]{10}$/, '10 digit phone number required']
    }
  },

  // Performance Metrics (NEW)
  performance: {
    totalDeliveries: {
      type: Number,
      default: 0
    },
    completedDeliveries: {
      type: Number,
      default: 0
    },
    cancelledDeliveries: {
      type: Number,
      default: 0
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    onTimeDeliveryRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    totalDistance: {
      type: Number,
      default: 0
    },
    totalEarnings: {
      type: Number,
      default: 0
    }
  },

  // Block Status
  blockStatus: {
    isBlocked: {
      type: Boolean,
      default: false
    },
    blockedAt: Date,
    blockedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    blockReason: String,
    blockType: {
      type: String,
      enum: ['temporary', 'permanent']
    },
    unblockDate: Date
  },

  ///fuel status



  // PIN management
  pinAttempts: { type: Number, default: 0 },
  pinLockedUntil: { type: Date },

  // Password reset
  resetPasswordToken: String,
  resetPasswordExpires: Date,

  // PIN reset
  resetPinToken: String,
  resetPinExpires: Date,

}, { timestamps: true });

// Indexes
driverSchema.index({ phone: 1 }, { unique: true });
driverSchema.index({ licenseNumber: 1 }, { unique: true });
driverSchema.index({ profileStatus: 1 });
driverSchema.index({ isAvailable: 1 });
driverSchema.index({ 'blockStatus.isBlocked': 1 });

// Pre-save middleware
driverSchema.pre('save', async function (next) {
  // Hash password if modified
  if (this.isModified('password') && this.password) {
    if (this.password.length < 60) {
      this.password = await bcrypt.hash(this.password, 10);
    }
  }

  // Hash PIN if modified
  if (this.isModified('pin') && this.pin && this.pin.length < 60) {
    this.pin = await bcrypt.hash(this.pin, 10);
  }

  next();
});

// Compare password method
driverSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Compare PIN method
driverSchema.methods.comparePin = async function (candidatePin) {
  return await bcrypt.compare(candidatePin, this.pin);
};

// Remove sensitive data from JSON
driverSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.pin;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpires;
  delete obj.resetPinToken;
  delete obj.resetPinExpires;
  delete obj.pinAttempts;
  delete obj.pinLockedUntil;
  return obj;
};

module.exports = mongoose.model('Driver', driverSchema);