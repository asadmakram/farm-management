const mongoose = require('mongoose');

const contractSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  vendorName: {
    type: String,
    required: true,
    trim: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  ratePerLiter: {
    type: Number,
    required: true,
    min: 0,
    default: 182.5
  },
  advanceAmount: {
    type: Number,
    required: true,
    min: 0
  },
  advanceStatus: {
    type: String,
    enum: ['held', 'returned', 'forfeited'],
    default: 'held'
  },
  advanceReturnedDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'terminated'],
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

// Validate that endDate is after startDate
contractSchema.pre('validate', function(next) {
  if (this.endDate <= this.startDate) {
    next(new Error('End date must be after start date'));
  } else {
    next();
  }
});

contractSchema.index({ userId: 1, status: 1 });
contractSchema.index({ userId: 1, startDate: 1, endDate: 1 });

module.exports = mongoose.model('Contract', contractSchema);
