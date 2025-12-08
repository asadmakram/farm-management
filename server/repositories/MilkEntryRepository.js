const MilkEntry = require('../models/MilkEntry');

class MilkEntryRepository {
  async create(data) {
    return MilkEntry.create(data);
  }

  async findByAnimalDate(farmId, animalId, date) {
    return MilkEntry.findOne({ 
      farmId, 
      animalId, 
      date, 
      isActive: true 
    });
  }

  async findById(id) {
    return MilkEntry.findById(id);
  }

  async updateById(id, data) {
    return MilkEntry.findByIdAndUpdate(id, data, { new: true });
  }

  async listByFarmDate(farmId, date) {
    return MilkEntry.find({ 
      farmId, 
      date, 
      isActive: true 
    }).populate('animalId', 'name animalCode');
  }

  async listByAnimalDateRange(farmId, animalId, startDate, endDate) {
    return MilkEntry.find({
      farmId,
      animalId,
      date: { $gte: startDate, $lte: endDate },
      isActive: true
    }).sort({ date: -1 });
  }

  async deleteById(id) {
    return MilkEntry.findByIdAndUpdate(id, { isActive: false }, { new: true });
  }
}

module.exports = MilkEntryRepository;
