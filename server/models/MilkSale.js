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
  saleType: {
    type: String,
    enum: ['bandhi', 'mandi', 'door_to_door'],
    required: true
  },
  // For Bandhi (Contract)
  contractId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contract'
  },
  // For Mandi (time-based rates) and Bandhi (contract-based with time tracking)
  timeOfDay: {
    type: String,
    enum: ['morning', 'evening'],
    required: function() { return this.saleType === 'mandi' || this.saleType === 'bandhi'; }
  },
  // For Door-to-Door
  packagingCost: {
    type: Number,
    default: 0,
    min: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
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
    enum: ['pending', 'received', 'returned'],
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

// Calculate total amount before validation
milkSaleSchema.pre('validate', function(next) {
  const qty = Number(this.quantity) || 0;
  const rate = Number(this.ratePerLiter) || 0;
  const packaging = Number(this.packagingCost) || 0;

  if (this.saleType === 'door_to_door') {
    this.totalAmount = qty * (rate + packaging);
  } else {
    this.totalAmount = qty * rate;
  }

  next();
});

milkSaleSchema.index({ userId: 1, date: -1 });
milkSaleSchema.index({ userId: 1, saleType: 1 });

module.exports = mongoose.model('MilkSale', milkSaleSchema);
