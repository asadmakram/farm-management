const mongoose = require('mongoose');

const feedOrderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  feedItems: [{
    feedItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FeedItem',
      required: true
    },
    quantityPerTime: {
      type: Number,
      required: true,
      min: 0
    },
    numberOfTimesPerDay: {
      type: Number,
      required: true,
      min: 1,
      max: 10
    }
  }],
  numberOfAnimals: {
    type: Number,
    required: true,
    min: 1
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  numberOfDays: {
    type: Number,
    required: true
  },
  totalQuantityRequired: {
    type: Number,
    default: 0
  },
  bagsRequired: {
    type: Number,
    default: 0
  },
  totalCost: {
    type: Number,
    default: 0
  },
  orderDetails: [{
    feedItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FeedItem'
    },
    itemName: String,
    quantityRequired: Number,
    bagsRequired: Number,
    costRequired: Number
  }],
  supplierPhone: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['DRAFT', 'ORDERED', 'DELIVERED', 'ACTIVE', 'COMPLETED', 'CANCELLED'],
    default: 'DRAFT'
  },
  whatsappMessageSent: {
    type: Boolean,
    default: false
  },
  whatsappMessageTime: Date,
  deliveryConfirmedAt: Date,
  deliveryConfirmedBy: String,
  actualQuantityReceived: {
    type: Number,
    default: null
  },
  notes: String,
  paymentStatus: {
    type: String,
    enum: ['PENDING', 'PARTIAL_PAID', 'PAID', 'CASH', 'CREDIT'],
    default: 'PENDING'
  },
  paymentMethod: {
    type: String,
    enum: ['CASH', 'BANK_TRANSFER', 'CHEQUE', 'ONLINE', 'CREDIT'],
    default: 'CASH'
  },
  amountPaid: {
    type: Number,
    default: 0
  },
  amountDue: {
    type: Number,
    default: 0
  },
  paymentHistory: [{
    amount: Number,
    paidAt: Date,
    method: String,
    notes: String
  }],
  lastPaymentDate: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for userId
feedOrderSchema.index({ userId: 1, status: 1 });
feedOrderSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('FeedOrder', feedOrderSchema);
