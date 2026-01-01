const mongoose = require('mongoose');

const feedCategorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    enum: ['Cereals', 'Supplements', 'Minerals', 'Forage', 'Concentrates', 'Vitamins', 'Other']
  },
  description: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for userId and name to prevent duplicate categories per user
feedCategorySchema.index({ userId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('FeedCategory', feedCategorySchema);
