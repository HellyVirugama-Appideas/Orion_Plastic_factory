// const mongoose = require('mongoose');

// const journeySchema = new mongoose.Schema({
//   deliveryId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Delivery',
//     required: true
//   },
//   driverId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Driver',
//     required: true
//   },
//   startLocation: {
//     address: String,
//     coordinates: {
//       latitude: { type: Number, required: true },
//       longitude: { type: Number, required: true }
//     }
//   },
//   endLocation: {
//     address: String,
//     coordinates: {
//       latitude: Number,
//       longitude: Number
//     }
//   },
//   startTime: {
//     type: Date,
//     required: true,
//     default: Date.now
//   },
//   endTime: Date,
//   status: {
//     type: String,
//     enum: ['started', 'in_progress', 'completed', 'cancelled'],
//     default: 'started'
//   },
//   waypoints: [{
//     location: {
//       coordinates: {
//         latitude: Number,
//         longitude: Number
//       },
//       address: String
//     },
//     timestamp: Date,
//     activity: String // 'stop', 'traffic', 'checkpoint', etc.
//   }],
//   images: [{
//     url: String,
//     caption: String,
//     timestamp: Date,
//     location: {
//       latitude: Number,
//       longitude: Number
//     }
//   }],
//   totalDistance: { type: Number, default: 0 },
//   totalDuration: { type: Number, default: 0 }, // in minutes
//   averageSpeed: Number,
//   maxSpeed: Number,
//   finalRemarks: String,
//   createdAt: {
//     type: Date,
//     default: Date.now
//   }
// }, {
//   timestamps: true
// });

// // Index
// journeySchema.index({ deliveryId: 1 });
// journeySchema.index({ driverId: 1, startTime: -1 });

// module.exports = mongoose.model('Journey', journeySchema);

const mongoose = require('mongoose');

const journeySchema = new mongoose.Schema({
  deliveryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Delivery',
    required: true,
    index: true
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    required: true,
    index: true
  },
  
  // Start Location (Screen 1)
  startLocation: {
    address: String,
    coordinates: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true }
    }
  },
  
  // End Location (Screen 5)
  endLocation: {
    address: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  
  // Journey Timeline
  startTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  endTime: Date,
  
  // Journey Status
  status: {
    type: String,
    enum: ['started', 'in_progress', 'completed', 'cancelled'],
    default: 'started',
    index: true
  },
  
  // Checkpoints/Stops (Screen 2)
  waypoints: [{
    location: {
      coordinates: {
        latitude: { type: Number, required: true },
        longitude: { type: Number, required: true }
      },
      address: String
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    activity: {
      type: String,
      enum: ['checkpoint', 'stop', 'traffic', 'break', 'refuel', 'other'],
      default: 'checkpoint'
    },
    remarks: String
  }],
  
  // Journey Images (Screen 3)
  images: [{
    url: {
      type: String,
      required: true
    },
    caption: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    location: {
      latitude: Number,
      longitude: Number
    },
    imageType: {
      type: String,
      enum: ['pickup', 'delivery', 'damage', 'general', 'checkpoint'],
      default: 'general'
    }
  }],
  
  // Journey Metrics
  totalDistance: { 
    type: Number, 
    default: 0 
  }, // in kilometers
  
  totalDuration: { 
    type: Number, 
    default: 0 
  }, // in minutes
  
  averageSpeed: Number, // km/h
  maxSpeed: Number, // km/h
  
  // Final Remarks (Screen 5)
  finalRemarks: String,
  
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound Indexes for better query performance
journeySchema.index({ deliveryId: 1, status: 1 });
journeySchema.index({ driverId: 1, startTime: -1 });
journeySchema.index({ driverId: 1, status: 1 });

// Virtual for journey duration in readable format
journeySchema.virtual('durationFormatted').get(function() {
  if (!this.totalDuration) return 'N/A';
  const hours = Math.floor(this.totalDuration / 60);
  const minutes = this.totalDuration % 60;
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
});

// Virtual for distance in readable format
journeySchema.virtual('distanceFormatted').get(function() {
  if (!this.totalDistance) return 'N/A';
  return `${this.totalDistance.toFixed(2)} km`;
});

// Method to check if journey is active
journeySchema.methods.isActive = function() {
  return ['started', 'in_progress'].includes(this.status);
};

// Method to calculate current duration
journeySchema.methods.getCurrentDuration = function() {
  const end = this.endTime || new Date();
  const durationMs = end - new Date(this.startTime);
  return Math.round(durationMs / 60000);
};

// Static method to find active journey for a driver
journeySchema.statics.findActiveJourney = function(driverId) {
  return this.findOne({
    driverId,
    status: { $in: ['started', 'in_progress'] }
  });
};

module.exports = mongoose.model('Journey', journeySchema);