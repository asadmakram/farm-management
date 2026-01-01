const mongoose = require('mongoose');

const feedChartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  numberOfAnimals: {
    type: Number,
    required: true,
    min: 1
  },
  animalType: {
    type: String,
    trim: true,
    required: false
  },
  feedItems: [{
    feedItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FeedItem',
      required: true
    },
    quantityPerTime: {
      type: Number,
      required: true,
      min: 0
    },
    numberOfTimesPerDay: {
      type: Number,
      required: true,
      default: 2,
      min: 1
    },
    percentage: {
      type: Number,
      min: 0,
      max: 100
    }
  }],
  totalDailyQuantity: {
    type: Number,
    min: 0
  },
  totalDailyCost: {
    type: Number,
    min: 0
  },
  calculationNotes: {
    type: String,
    trim: true
  },
  isTemplate: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for userId and name to ensure unique feed charts per user
feedChartSchema.index({ userId: 1, name: 1 }, { unique: true });
feedChartSchema.index({ userId: 1, isTemplate: 1 });

module.exports = mongoose.model('FeedChart', feedChartSchema);