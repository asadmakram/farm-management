const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Vaccination = require('../models/Vaccination');
const auth = require('../middleware/auth');

// @route   GET /api/vaccinations
// @desc    Get all vaccinations
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { animalId } = req.query;
    
    let query = { userId: req.user._id };
    
    if (animalId) {
      query.animalId = animalId;
    }

    const vaccinations = await Vaccination.find(query)
      .populate('animalId', 'tagNumber name breed')
      .sort({ dateAdministered: -1 });

    res.json({ 
      success: true, 
      count: vaccinations.length,
      data: vaccinations 
    });
  } catch (error) {
    console.error('Get vaccinations error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/vaccinations
// @desc    Create new vaccination record
// @access  Private
router.post(
  '/',
  [
    auth,
    body('animalId').notEmpty().withMessage('Animal ID is required'),
    body('vaccineName').trim().notEmpty().withMessage('Vaccine name is required'),
    body('dateAdministered').notEmpty().withMessage('Date is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const vaccinationData = {
        ...req.body,
        userId: req.user._id
      };

      const vaccination = new Vaccination(vaccinationData);
      await vaccination.save();

      await vaccination.populate('animalId', 'tagNumber name breed');

      res.status(201).json({ 
        success: true, 
        message: 'Vaccination record added successfully', 
        data: vaccination 
      });
    } catch (error) {
      console.error('Create vaccination error:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

// @route   PUT /api/vaccinations/:id
// @desc    Update vaccination
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    let vaccination = await Vaccination.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });

    if (!vaccination) {
      return res.status(404).json({ success: false, message: 'Vaccination not found' });
    }

    vaccination = await Vaccination.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('animalId', 'tagNumber name breed');

    res.json({ 
      success: true, 
      message: 'Vaccination updated successfully', 
      data: vaccination 
    });
  } catch (error) {
    console.error('Update vaccination error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   DELETE /api/vaccinations/:id
// @desc    Delete vaccination
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const vaccination = await Vaccination.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });

    if (!vaccination) {
      return res.status(404).json({ success: false, message: 'Vaccination not found' });
    }

    await Vaccination.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Vaccination deleted successfully' });
  } catch (error) {
    console.error('Delete vaccination error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
