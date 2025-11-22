const mongoose = require('mongoose');

const milkProductionSchema = new mongoose.Schema({
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
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  morningYield: {
    type: Number,
    default: 0,
    min: 0
  },
  eveningYield: {
    type: Number,
    default: 0,
    min: 0
  },
  totalYield: {
    type: Number,
    required: true,
    min: 0
  },
  quality: {
    type: String,
    enum: ['excellent', 'good', 'average', 'poor'],
    default: 'good'
  },
  notes: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Calculate total yield before validation to ensure it exists for required validation
milkProductionSchema.pre('validate', function(next) {
  // Coerce values to numbers and default to 0 if missing
  const morning = this.morningYield !== undefined && this.morningYield !== null ? Number(this.morningYield) : 0;
  const evening = this.eveningYield !== undefined && this.eveningYield !== null ? Number(this.eveningYield) : 0;
  this.morningYield = isNaN(morning) ? 0 : morning;
  this.eveningYield = isNaN(evening) ? 0 : evening;
  this.totalYield = this.morningYield + this.eveningYield;
  next();
});

milkProductionSchema.index({ userId: 1, date: -1 });
milkProductionSchema.index({ userId: 1, animalId: 1, date: -1 });

module.exports = mongoose.model('MilkProduction', milkProductionSchema);
