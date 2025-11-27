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
  amountPaid: {
    type: Number,
    default: 0,
    min: 0
  },
  amountPending: {
    type: Number,
    min: 0
  },
  payments: [{
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    date: {
      type: Date,
      default: Date.now
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'bank_transfer', 'cheque', 'other'],
      default: 'cash'
    },
    notes: String
  }],
  paymentStatus: {
    type: String,
    enum: ['pending', 'partial', 'received', 'returned'],
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

// Calculate payment status and pending amount before saving
milkSaleSchema.pre('save', function(next) {
  // Calculate total paid from payments array
  const totalPaid = this.payments.reduce((sum, payment) => sum + payment.amount, 0);
  this.amountPaid = totalPaid;
  this.amountPending = Math.max(0, this.totalAmount - totalPaid);

  // Update payment status based on amounts
  if (totalPaid === 0) {
    this.paymentStatus = 'pending';
  } else if (totalPaid >= this.totalAmount) {
    this.paymentStatus = 'received';
  } else {
    this.paymentStatus = 'partial';
  }

  next();
});

milkSaleSchema.index({ userId: 1, date: -1 });
milkSaleSchema.index({ userId: 1, saleType: 1 });

module.exports = mongoose.model('MilkSale', milkSaleSchema);
