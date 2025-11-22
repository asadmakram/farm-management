const mongoose = require('mongoose');

const animalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tagNumber: {
    type: String,
    required: true,
    trim: true
  },
  name: {
    type: String,
    trim: true
  },
  breed: {
    type: String,
    required: true,
    trim: true
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  gender: {
    type: String,
    enum: ['male', 'female'],
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'sold', 'deceased', 'dry'],
    default: 'active'
  },
  purchaseDate: {
    type: Date,
    default: Date.now
  },
  purchasePrice: {
    type: Number,
    default: 0
  },
  weight: {
    type: Number
  },
  notes: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index for userId and tagNumber to ensure unique tags per user
animalSchema.index({ userId: 1, tagNumber: 1 }, { unique: true });

module.exports = mongoose.model('Animal', animalSchema);
