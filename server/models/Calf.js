const mongoose = require('mongoose');

const calfSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  animalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Animal',
    required: true
  },
  motherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Animal',
    required: true
  },
  birthDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  birthWeight: {
    type: Number,
    required: true,
    min: 0
  },
  gender: {
    type: String,
    enum: ['male', 'female'],
    required: true
  },
  dailyCosts: [{
    date: {
      type: Date,
      required: true
    },
    feedCost: {
      type: Number,
      default: 0
    },
    medicineCost: {
      type: Number,
      default: 0
    },
    otherCost: {
      type: Number,
      default: 0
    },
    totalCost: {
      type: Number,
      default: 0
    }
  }],
  status: {
    type: String,
    enum: ['active', 'weaned', 'sold', 'deceased'],
    default: 'active'
  },
  notes: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

calfSchema.index({ userId: 1, birthDate: -1 });
calfSchema.index({ userId: 1, motherId: 1 });

module.exports = mongoose.model('Calf', calfSchema);
