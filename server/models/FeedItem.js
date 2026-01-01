const mongoose = require('mongoose');

const feedItemSchema = new mongoose.Schema({
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
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FeedCategory',
    required: false
  },
  quantityPerBag: {
    type: Number,
    required: true,
    min: 0
  },
  unit: {
    type: String,
    required: true,
    default: 'kg',
    enum: ['kg', 'lbs', 'g', 'mg', 'tons']
  },
  pricePerBag: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    required: true,
    default: 'USD'
  },
  description: {
    type: String,
    trim: true
  },
  supplier: {
    type: String,
    trim: true
  },
  shelfLife: {
    value: {
      type: Number,
      min: 0
    },
    unit: {
      type: String,
      enum: ['days', 'weeks', 'months', 'years']
    }
  },
  storageRequirements: {
    type: String,
    trim: true
  },
  nutritionalInfo: {
    protein: Number,
    fat: Number,
    fiber: Number,
    ash: Number,
    moisture: Number
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

// Index for userId and name to ensure unique feed items per user
feedItemSchema.index({ userId: 1, name: 1 }, { unique: true });
feedItemSchema.index({ userId: 1, category: 1 });

module.exports = mongoose.model('FeedItem', feedItemSchema);