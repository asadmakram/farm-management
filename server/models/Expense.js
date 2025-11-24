const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
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
  category: {
    type: String,
    enum: [
      // Asset Expenses (Capital)
      'animal_purchase',
      'equipment_purchase',
      'land_improvement',
      'building_construction',
      
      // Operating Expenses (Monthly/Recurring)
      'feed',
      'labour',
      'rental',
      'veterinary',
      'medicine',
      'utilities',
      'transportation',
      'utensils',
      'maintenance',
      'insurance',
      'other'
    ],
    required: true
  },
  expenseType: {
    type: String,
    enum: ['asset', 'operating'],
    required: true,
    default: 'operating'
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    trim: true
  },
  animalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Animal'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

expenseSchema.index({ userId: 1, date: -1 });
expenseSchema.index({ userId: 1, category: 1 });

module.exports = mongoose.model('Expense', expenseSchema);
