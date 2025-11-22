const mongoose = require('mongoose');

const vaccinationSchema = new mongoose.Schema({
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
  vaccineName: {
    type: String,
    required: true,
    trim: true
  },
  dateAdministered: {
    type: Date,
    required: true
  },
  nextDueDate: {
    type: Date
  },
  veterinarian: {
    type: String,
    trim: true
  },
  cost: {
    type: Number,
    default: 0
  },
  notes: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

vaccinationSchema.index({ userId: 1, animalId: 1 });

module.exports = mongoose.model('Vaccination', vaccinationSchema);
