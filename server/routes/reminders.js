const express = require('express');
const router = express.Router();
const Vaccination = require('../models/Vaccination');
const Calf = require('../models/Calf');
const auth = require('../middleware/auth');

console.log('Reminders route loaded');

// @route   GET /api/reminders
// @desc    Get all reminders (vaccinations and recent calves)
// @access  Private
router.get('/', async (req, res) => {
  // Temporarily remove auth for debugging
  // auth,
  const userId = '694bb9cdd9f9493e8c73075f'; // Hardcode for testing
  try {

    // Get all upcoming vaccinations (next 90 days to show more comprehensive view)
    const ninetyDaysFromNow = new Date();
    ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);

    console.log('Fetching vaccinations for userId:', userId);

    const vaccinations = await Vaccination.find({
      userId,
      nextDueDate: { $exists: true, $ne: null }
    })
      .populate('animalId', 'tagNumber name')
      .sort({ nextDueDate: 1 });

    console.log('Found vaccinations before filtering:', vaccinations.length);
    console.log('Vaccinations data:', vaccinations.map(v => ({
      id: v._id,
      animalId: v.animalId,
      nextDueDate: v.nextDueDate
    })));

    // Filter out any that still have null animalId after populate (orphaned records)
    const validVaccinations = vaccinations.filter(v => v.animalId !== null);

    console.log('Valid vaccinations after filtering:', validVaccinations.length);

    // Get recent calves (last 60 days)
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const calves = await Calf.find({
      userId,
      animalId: { $ne: null }, // Filter out calves with deleted animals
      birthDate: { $gte: sixtyDaysAgo }
    })
      .populate('animalId', 'tagNumber name')
      .populate('motherId', 'tagNumber name')
      .sort({ birthDate: -1 });

    // Filter out any that still have null animalId after populate (orphaned records)
    const validCalves = calves.filter(c => c.animalId !== null);

    res.json({
      success: true,
      data: {
        vaccinations: validVaccinations,
        calves: validCalves
      }
    });
  } catch (error) {
    console.error('Reminders error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;