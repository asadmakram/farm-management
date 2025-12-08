const { Schema, model } = require('mongoose');

const milkSessionSchema = new Schema({
  liters: { type: Number, required: true },
  fat: Number,
  snf: Number
}, { _id: false });

const MilkEntrySchema = new Schema(
  {
    farmId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Farm', 
      required: true, 
      index: true 
    },
    animalId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Animal', 
      required: true, 
      index: true 
    },
    date: { 
      type: String, 
      required: true 
    },
    sessions: {
      morning: milkSessionSchema,
      evening: milkSessionSchema,
      custom: { type: Map, of: milkSessionSchema }
    },
    totalLiters: { 
      type: Number, 
      required: true 
    },
    notes: String,
    isActive: { 
      type: Boolean, 
      default: true 
    }
  },
  { timestamps: true }
);

MilkEntrySchema.index({ farmId: 1, animalId: 1, date: 1 }, { unique: true });
MilkEntrySchema.index({ farmId: 1, date: 1 });

module.exports = model('MilkEntry', MilkEntrySchema);
