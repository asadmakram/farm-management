const mongoose = require('mongoose');

const milkSaleSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  customerType: {
    type: String,
    enum: ['contractor', 'individual', 'retail'],
    required: true
  },
  customerName: {
    type: String,
    trim: true
  },
  ratePerLiter: {
    type: Number,
    required: true,
    min: 0
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentStatus: {
    type: String,
    enum: ['paid', 'pending', 'partial'],
    default: 'pending'
  },
  notes: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Calculate total amount before validation to ensure it's present for required validation
milkSaleSchema.pre('validate', function(next) {
  // ensure numeric conversion
  const qty = Number(this.quantity) || 0;
  const rate = Number(this.ratePerLiter) || 0;
  this.totalAmount = qty * rate;
  next();
});

milkSaleSchema.index({ userId: 1, date: -1 });
milkSaleSchema.index({ userId: 1, customerType: 1 });

module.exports = mongoose.model('MilkSale', milkSaleSchema);
