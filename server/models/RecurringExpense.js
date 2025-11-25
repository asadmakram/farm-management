const mongoose = require('mongoose');

const recurringExpenseSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  expenseType: {
    type: String,
    enum: [
      'master_b10_vanda',
      'mix_atti',
      'chaukar',
      'tukra',
      'green_fodder',
      'worker_wage',
      'medical',
      'rent',
      'toori_wheat_straw'
    ],
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  frequency: {
    type: String,
    enum: ['daily', '10_days', 'monthly'],
    default: '10_days'
  },
  lastPurchaseDate: {
    type: Date,
    default: Date.now
  },
  nextPurchaseDate: {
    type: Date
  },
  // For worker wages - multiple workers support
  workerCount: {
    type: Number,
    default: 1,
    min: 1
  },
  isActive: {
    type: Boolean,
    default: true
  },
  notes: {
    type: String
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

// Calculate next purchase date based on frequency
recurringExpenseSchema.pre('save', function(next) {
  if (this.isModified('lastPurchaseDate') || this.isModified('frequency')) {
    const lastDate = new Date(this.lastPurchaseDate);

    switch(this.frequency) {
      case 'daily':
        this.nextPurchaseDate = new Date(lastDate.setDate(lastDate.getDate() + 1));
        break;
      case '10_days':
        this.nextPurchaseDate = new Date(lastDate.setDate(lastDate.getDate() + 10));
        break;
      case 'monthly':
        this.nextPurchaseDate = new Date(lastDate.setMonth(lastDate.getMonth() + 1));
        break;
    }
  }

  this.updatedAt = Date.now();
  next();
});

recurringExpenseSchema.index({ userId: 1, isActive: 1 });
recurringExpenseSchema.index({ userId: 1, expenseType: 1 });

module.exports = mongoose.model('RecurringExpense', recurringExpenseSchema);
