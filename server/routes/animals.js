const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Animal = require('../models/Animal');
const auth = require('../middleware/auth');

// @route   GET /api/animals
// @desc    Get all animals for user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const animals = await Animal.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, count: animals.length, data: animals });
  } catch (error) {
    console.error('Get animals error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/animals/:id
// @desc    Get single animal
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const animal = await Animal.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });

    if (!animal) {
      return res.status(404).json({ success: false, message: 'Animal not found' });
    }

    res.json({ success: true, data: animal });
  } catch (error) {
    console.error('Get animal error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/animals
// @desc    Create new animal
// @access  Private
router.post(
  '/',
  [
    auth,
    body('tagNumber').trim().notEmpty().withMessage('Tag number is required'),
    body('breed').trim().notEmpty().withMessage('Breed is required'),
    body('dateOfBirth').notEmpty().withMessage('Date of birth is required'),
    body('gender').isIn(['male', 'female']).withMessage('Gender must be male or female')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const animalData = {
        ...req.body,
        userId: req.user._id
      };

      const animal = new Animal(animalData);
      await animal.save();

      res.status(201).json({ 
        success: true, 
        message: 'Animal added successfully', 
        data: animal 
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).json({ 
          success: false, 
          message: 'Animal with this tag number already exists' 
        });
      }
      console.error('Create animal error:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

// @route   PUT /api/animals/:id
// @desc    Update animal
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    let animal = await Animal.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });

    if (!animal) {
      return res.status(404).json({ success: false, message: 'Animal not found' });
    }

    animal = await Animal.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({ 
      success: true, 
      message: 'Animal updated successfully', 
      data: animal 
    });
  } catch (error) {
    console.error('Update animal error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   DELETE /api/animals/:id
// @desc    Delete animal
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const animal = await Animal.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });

    if (!animal) {
      return res.status(404).json({ success: false, message: 'Animal not found' });
    }

    await Animal.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Animal deleted successfully' });
  } catch (error) {
    console.error('Delete animal error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
