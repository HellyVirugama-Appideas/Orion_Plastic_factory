// const mongoose = require('mongoose');

// const driverSchema = new mongoose.Schema({
//   userId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true,
//     unique: true
//   },
//   licenseNumber: {
//     type: String,
//     required: [true, 'License number is required'],
//     unique: true,
//     trim: true
//   },
//   vehicleType: {
//     type: String,
//     required: [true, 'Vehicle type is required'],
//     enum: ['car', 'bike', 'auto', 'truck']
//   },
//   vehicleNumber: {
//     type: String,
//     required: [true, 'Vehicle number is required'],
//     unique: true,
//     uppercase: true,
//     trim: true
//   },
//   vehicleModel: {
//     type: String,
//     trim: true
//   },
//   vehicleColor: {
//     type: String,
//     trim: true
//   },
//   pin: {
//     type: String,
//     required: [true, '4-digit PIN is required']
//   },
//   pinAttempts: {
//     type: Number,
//     default: 0
//   },
//   pinLockedUntil: {
//     type: Date,
//     default: null
//   },
//   resetPinToken: String,
//   resetPinExpires: Date,
//   profileStatus: {
//     type: String,
//     enum: ['incomplete', 'pending_verification', 'approved', 'rejected'],
//     default: 'incomplete'
//   },
//   isAvailable: {
//     type: Boolean,
//     default: false
//   },
//   rating: {
//     type: Number,
//     default: 0,
//     min: 0,
//     max: 5
//   },
//   totalRides: {
//     type: Number,
//     default: 0
//   },
//   createdAt: {
//     type: Date,
//     default: Date.now
//   },
//   updatedAt: {
//     type: Date,
//     default: Date.now
//   }
// }, {
//   timestamps: true
// });

// module.exports = mongoose.model('Driver', driverSchema);

// models/Driver.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const driverSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true
  },
  email: {
    type: String, 
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Valid email required']
  },
  phone: {
    type: String,
    unique: true,
    match: [/^[0-9]{10}$/, '10 digit phone number']
  },
  password: {
    type: String,
    // required: [true, 'password is required'],
    minlength: [6, 'Password minimum 6 characters']
  },
  role: {
    type: String,
    default: 'driver',
    enum: ['driver']  
  },

  // Driver specific fields
  licenseNumber: { type: String, required: true, unique: true },
  vehicleType: { type: String, required: true, enum: ['car', 'bike', 'auto', 'truck'] },
  vehicleNumber: { type: String, required: true, unique: true, uppercase: true },
  vehicleModel: String,
  vehicleColor: String,
  pin: { type: String, required: true }, 

  profileStatus: {
    type: String,
    enum: ['incomplete', 'pending_verification', 'approved', 'rejected'],
    default: 'incomplete'
  },
  isAvailable: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },

  profileImage: { type: String, default: null },
  rating: { type: Number, default: 0 },
  totalRides: { type: Number, default: 0 },

    documents: [{
    documentType: {
      type: String,
      required: true,
      enum: [
        'aadhaarFront',
        'aadhaarBack',
        'licenseFront',
        'licenseBack',
        'panCard',
        'vehicleRC',
        'vehicleInsurance',
        'policeVerification',
        'fitnessCertificate',
        'permit',
        'other'
      ]
    },
    fileUrl: { type: String, required: true },
    documentNumber: { type: String },
    expiryDate: { type: Date },
    status: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending'
    },
    uploadedAt: { type: Date, default: Date.now }
  }],

  resetPasswordToken: String,
  resetPasswordExpires: Date,
  resetPinToken: String,
  resetPinExpires: Date,

}, { timestamps: true }); 

// // Password hash before save
// driverSchema.pre('save', async function(next) {
//   if (!this.isModified('password')) return next();
//   this.password = await bcrypt.hash(this.password, 10);
//   next();
// });

// // PIN hash (if needed)
// driverSchema.pre('save', async function(next) {
//   if (this.isModified('pin') && this.pin.length !== 60) {
//     this.pin = await bcrypt.hash(this.pin, 10);
//   }
//   next();
// });

// // Compare password
// driverSchema.methods.comparePassword = async function(pass) {
//   return bcrypt.compare(pass, this.password);
// };

// // Remove sensitive data
// driverSchema.methods.toJSON = function() {
//   const obj = this.toObject();
//   delete obj.password;
//   delete obj.pin; 
//   delete obj.resetPasswordToken;
//   delete obj.resetPasswordExpires;
//   delete obj.resetPinToken;
//   delete obj.resetPinExpires;
//   return obj;
// };

// models/Driver.js → YEHI CODE LAGA DO

driverSchema.pre('save', async function (next) {
  // Password hash karo agar modified hai aur already hashed nahi hai
  if (this.isModified('password') && this.password) {
    if (this.password.length < 60) { // agar plain text hai
      this.password = await bcrypt.hash(this.password, 10);
    }
  }

  // PIN hash karo
  if (this.isModified('pin') && this.pin && this.pin.length < 60) {
    this.pin = await bcrypt.hash(this.pin, 10);
  }

  next();
});

// comparePassword method — YEHI DAALO (warna error aayega!)
driverSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};
driverSchema.index({ email: 1 }, { unique: true });
driverSchema.index({ phone: 1 }, { unique: true });
driverSchema.index({ licenseNumber: 1 }, { unique: true });
driverSchema.index({ vehicleNumber: 1 }, { unique: true });

module.exports = mongoose.model('Driver', driverSchema);