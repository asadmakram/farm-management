const mongoose = require('mongoose');

const currencySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  code: {
    type: String,
    required: true,
    uppercase: true,
    minlength: 3,
    maxlength: 3
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  symbol: {
    type: String,
    required: true,
    trim: true
  },
  exchangeRate: {
    type: Number,
    required: true,
    min: 0
  },
  baseCurrency: {
    type: String,
    default: 'INR',
    uppercase: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isDefault: {
    type: Boolean,
    default: false
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

// Ensure only one default currency per user
currencySchema.pre('save', async function(next) {
  if (this.isDefault) {
    await this.constructor.updateMany(
      { userId: this.userId, _id: { $ne: this._id } },
      { isDefault: false }
    );
  }
  this.updatedAt = Date.now();
  next();
});

// Index for efficient queries
currencySchema.index({ userId: 1, code: 1 }, { unique: true });
currencySchema.index({ userId: 1, isActive: 1 });
currencySchema.index({ userId: 1, isDefault: 1 });

module.exports = mongoose.model('Currency', currencySchema);