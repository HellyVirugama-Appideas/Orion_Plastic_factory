const mongoose = require('mongoose');

const trackingLogSchema = new mongoose.Schema({
  deliveryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Delivery',
    required: true
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    required: true
  },
  location: {
    coordinates: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true }
    },
    address: String,
    accuracy: Number // in meters
  },
  speed: Number, // km/h
  heading: Number, // direction in degrees
  batteryLevel: Number,
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: false
});

// Index for efficient querying
trackingLogSchema.index({ deliveryId: 1, timestamp: -1 });
trackingLogSchema.index({ driverId: 1, timestamp: -1 });

// Auto-delete logs older than 30 days
trackingLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 2592000 });

module.exports = mongoose.model('TrackingLog', trackingLogSchema);