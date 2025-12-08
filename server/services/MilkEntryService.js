const MilkEntryRepository = require('../repositories/MilkEntryRepository');

class MilkEntryService {
  constructor() {
    this.repo = new MilkEntryRepository();
  }

  calcTotalLiters(sessions) {
    let total = 0;
    if (sessions.morning?.liters) total += sessions.morning.liters;
    if (sessions.evening?.liters) total += sessions.evening.liters;
    if (sessions.custom) {
      for (const session of sessions.custom.values?.()) {
        if (session?.liters) total += session.liters;
      }
    }
    return total;
  }

  async createOrUpdateEntry({ farmId, animalId, date, sessions, notes }) {
    const totalLiters = this.calcTotalLiters(sessions);
    
    let entry = await this.repo.findByAnimalDate(farmId, animalId, date);
    
    if (entry) {
      entry.sessions = sessions;
      entry.totalLiters = totalLiters;
      entry.notes = notes || entry.notes;
      await entry.save();
      return entry;
    }

    return this.repo.create({
      farmId,
      animalId,
      date,
      sessions,
      totalLiters,
      notes,
      isActive: true
    });
  }

  async getEntry(farmId, animalId, date) {
    return this.repo.findByAnimalDate(farmId, animalId, date);
  }

  async getEntryById(id) {
    return this.repo.findById(id);
  }

  async listEntriesByDate(farmId, date) {
    return this.repo.listByFarmDate(farmId, date);
  }

  async listEntriesByAnimal(farmId, animalId, startDate, endDate) {
    return this.repo.listByAnimalDateRange(farmId, animalId, startDate, endDate);
  }

  async deleteEntry(id) {
    return this.repo.deleteById(id);
  }
}

module.exports = MilkEntryService;
