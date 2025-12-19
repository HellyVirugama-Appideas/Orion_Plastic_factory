const mongoose = require('mongoose');

const deliverySchema = new mongoose.Schema({
  trackingNumber: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  orderId: {
    type: String,
    required: true,
    unique: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipientName: String,
  recipientPhone: String, // fallback if needed

  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    default: null
  },
  journeyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Journey',
    index: true
  },
  vehicleNumber: {
    type: String,
    default: null
  },

  pickupLocation: {
    address: { type: String, required: true },
    coordinates: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true }
    },
    contactPerson: String,
    contactPhone: String
  },
  deliveryLocation: {
    address: { type: String, required: true },
    coordinates: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true }
    },
    contactPerson: { type: String, required: true },
    contactPhone: { type: String, required: true }
  },
  status: {
    type: String,
    enum: ['pending', "pending_acceptance", 'assigned', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'cancelled', 'failed'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  packageDetails: {
    description: String,
    weight: Number,
    dimensions: {
      length: Number,
      width: Number,
      height: Number
    },
    quantity: { type: Number, default: 1 },
    value: Number,
    fragile: { type: Boolean, default: false }
  },
  scheduledPickupTime: Date,
  scheduledDeliveryTime: Date,
  actualPickupTime: Date,
  actualDeliveryTime: Date,
  estimatedDeliveryTime: Date,
  deliveryProof: {
    signature: String, // Image URL
    photos: [String], // Array of image URLs
    otp: String,
    otpVerified: { type: Boolean, default: false },
    receiverName: String
  },

  remarks: {
    type: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Remark'
    }],
    default: []
  },
  route: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Route',
    default: null
  },
  distance: { type: Number, default: 0 }, // in kilometers
  estimatedDuration: { type: Number, default: 0 }, // in minutes
  instructions: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Generate unique tracking number
deliverySchema.pre('save', async function (next) {
  if (this.isNew && !this.trackingNumber) {
    this.trackingNumber = `ORN${Date.now()}${Math.floor(Math.random() * 1000)}`;
  }
  next();
});

// Index for faster queries
deliverySchema.index({ trackingNumber: 1 });
deliverySchema.index({ orderId: 1 });
deliverySchema.index({ driverId: 1, status: 1 });
deliverySchema.index({ status: 1 });

module.exports = mongoose.model('Delivery', deliverySchema);