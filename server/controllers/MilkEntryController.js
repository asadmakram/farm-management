const MilkEntryService = require('../services/MilkEntryService');
const { validateMilkEntry } = require('../validations/milkEntryValidation');

const service = new MilkEntryService();

const upsertMilkEntry = async (req, res) => {
  try {
    const { error, value } = validateMilkEntry(req.body);
    
    if (error) {
      return res.status(400).json({ 
        error: error.details.map(d => d.message).join(", ") 
      });
    }

    const entry = await service.createOrUpdateEntry(value);
    res.status(201).json(entry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getMilkEntry = async (req, res) => {
  try {
    const { farmId, animalId, date } = req.query;

    if (!farmId || !animalId || !date) {
      return res.status(400).json({ 
        error: "farmId, animalId, and date are required" 
      });
    }

    const entry = await service.getEntry(farmId, animalId, date);
    
    if (!entry) {
      return res.status(404).json({ error: "Entry not found" });
    }

    res.json(entry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getMilkEntryById = async (req, res) => {
  try {
    const { id } = req.params;
    const entry = await service.getEntryById(id);
    
    if (!entry) {
      return res.status(404).json({ error: "Entry not found" });
    }

    res.json(entry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const listMilkEntriesByDate = async (req, res) => {
  try {
    const { farmId, date } = req.query;

    if (!farmId || !date) {
      return res.status(400).json({ 
        error: "farmId and date are required" 
      });
    }

    const entries = await service.listEntriesByDate(farmId, date);
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const listMilkEntriesByAnimal = async (req, res) => {
  try {
    const { farmId, animalId, startDate, endDate } = req.query;

    if (!farmId || !animalId || !startDate || !endDate) {
      return res.status(400).json({ 
        error: "farmId, animalId, startDate, and endDate are required" 
      });
    }

    const entries = await service.listEntriesByAnimal(farmId, animalId, startDate, endDate);
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteMilkEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const entry = await service.deleteEntry(id);
    
    if (!entry) {
      return res.status(404).json({ error: "Entry not found" });
    }

    res.json({ message: "Entry deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  upsertMilkEntry,
  getMilkEntry,
  getMilkEntryById,
  listMilkEntriesByDate,
  listMilkEntriesByAnimal,
  deleteMilkEntry
};
