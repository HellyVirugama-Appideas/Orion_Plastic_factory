const mongoose = require('mongoose');

const journeySchema = new mongoose.Schema({
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
  startLocation: {
    address: String,
    coordinates: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true }
    }
  },
  endLocation: {
    address: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  startTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  endTime: Date,
  status: {
    type: String,
    enum: ['started', 'in_progress', 'completed', 'cancelled'],
    default: 'started'
  },
  waypoints: [{
    location: {
      coordinates: {
        latitude: Number,
        longitude: Number
      },
      address: String
    },
    timestamp: Date,
    activity: String // 'stop', 'traffic', 'checkpoint', etc.
  }],
  images: [{
    url: String,
    caption: String,
    timestamp: Date,
    location: {
      latitude: Number,
      longitude: Number
    }
  }],
  totalDistance: { type: Number, default: 0 },
  totalDuration: { type: Number, default: 0 }, // in minutes
  averageSpeed: Number,
  maxSpeed: Number,
  finalRemarks: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index
journeySchema.index({ deliveryId: 1 });
journeySchema.index({ driverId: 1, startTime: -1 });

module.exports = mongoose.model('Journey', journeySchema);