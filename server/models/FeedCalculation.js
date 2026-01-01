const mongoose = require('mongoose');

const feedCalculationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  feedItemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FeedItem',
    required: true
  },
  feedChartId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FeedChart',
    required: false
  },
  // Quantity inputs
  quantityPerTime: {
    type: Number,
    required: true,
    min: 0
  },
  numberOfTimesPerDay: {
    type: Number,
    required: true,
    default: 2,
    min: 1,
    max: 10
  },
  numberOfAnimals: {
    type: Number,
    required: true,
    min: 1
  },
  // Calculated quantities
  quantityPerDay: {
    type: Number,
    required: true,
    min: 0
  },
  quantityPer10Days: {
    type: Number,
    required: true,
    min: 0
  },
  quantityPer20Days: {
    type: Number,
    required: true,
    min: 0
  },
  quantityPer30Days: {
    type: Number,
    required: true,
    min: 0
  },
  // Cost calculations
  costPer10Days: {
    type: Number,
    required: true,
    min: 0
  },
  costPer20Days: {
    type: Number,
    required: true,
    min: 0
  },
  costPer30Days: {
    type: Number,
    required: true,
    min: 0
  },
  // Additional metrics
  bagsRequired10Days: {
    type: Number,
    required: true,
    min: 0
  },
  bagsRequired20Days: {
    type: Number,
    required: true,
    min: 0
  },
  bagsRequired30Days: {
    type: Number,
    required: true,
    min: 0
  },
  notes: {
    type: String,
    trim: true
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

// Index for userId and feedItemId to ensure unique calculations per feed item and user
feedCalculationSchema.index({ userId: 1, feedItemId: 1 }, { unique: true });
feedCalculationSchema.index({ userId: 1, feedChartId: 1 });

module.exports = mongoose.model('FeedCalculation', feedCalculationSchema);