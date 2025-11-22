const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Calf = require('../models/Calf');
const auth = require('../middleware/auth');

// @route   GET /api/calves
// @desc    Get all calves
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const calves = await Calf.find({ userId: req.user._id })
      .populate('animalId', 'tagNumber name')
      .populate('motherId', 'tagNumber name')
      .sort({ birthDate: -1 });

    res.json({ 
      success: true, 
      count: calves.length,
      data: calves 
    });
  } catch (error) {
    console.error('Get calves error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/calves/:id
// @desc    Get single calf with cost analysis
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const calf = await Calf.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    })
      .populate('animalId', 'tagNumber name')
      .populate('motherId', 'tagNumber name');

    if (!calf) {
      return res.status(404).json({ success: false, message: 'Calf not found' });
    }

    // Calculate total costs
    const totalDailyCosts = calf.dailyCosts.reduce((sum, cost) => sum + cost.totalCost, 0);
    
    // Calculate monthly and yearly costs
    const daysTracked = calf.dailyCosts.length;
    const avgDailyCost = daysTracked > 0 ? totalDailyCosts / daysTracked : 0;
    const monthlyCost = avgDailyCost * 30;
    const yearlyCost = avgDailyCost * 365;

    res.json({ 
      success: true, 
      data: calf,
      costAnalysis: {
        totalCost: totalDailyCosts,
        averageDailyCost: avgDailyCost,
        projectedMonthlyCost: monthlyCost,
        projectedYearlyCost: yearlyCost,
        daysTracked
      }
    });
  } catch (error) {
    console.error('Get calf error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/calves
// @desc    Create new calf record
// @access  Private
router.post(
  '/',
  [
    auth,
    body('animalId').notEmpty().withMessage('Animal ID is required'),
    body('motherId').notEmpty().withMessage('Mother ID is required'),
    body('birthDate').notEmpty().withMessage('Birth date is required'),
    body('birthWeight').isFloat({ min: 0 }).withMessage('Birth weight must be positive'),
    body('gender').isIn(['male', 'female']).withMessage('Gender must be male or female')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const calfData = {
        ...req.body,
        userId: req.user._id
      };

      const calf = new Calf(calfData);
      await calf.save();

      await calf.populate(['animalId', 'motherId']);

      res.status(201).json({ 
        success: true, 
        message: 'Calf record added successfully', 
        data: calf 
      });
    } catch (error) {
      console.error('Create calf error:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

// @route   POST /api/calves/:id/daily-cost
// @desc    Add daily cost record for calf
// @access  Private
router.post(
  '/:id/daily-cost',
  [
    auth,
    body('date').notEmpty().withMessage('Date is required'),
    body('feedCost').isFloat({ min: 0 }).withMessage('Feed cost must be positive'),
    body('medicineCost').isFloat({ min: 0 }).withMessage('Medicine cost must be positive'),
    body('otherCost').isFloat({ min: 0 }).withMessage('Other cost must be positive')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const calf = await Calf.findOne({ 
        _id: req.params.id, 
        userId: req.user._id 
      });

      if (!calf) {
        return res.status(404).json({ success: false, message: 'Calf not found' });
      }

      const { date, feedCost, medicineCost, otherCost } = req.body;
      const totalCost = feedCost + medicineCost + otherCost;

      calf.dailyCosts.push({
        date,
        feedCost,
        medicineCost,
        otherCost,
        totalCost
      });

      await calf.save();

      res.json({ 
        success: true, 
        message: 'Daily cost added successfully', 
        data: calf 
      });
    } catch (error) {
      console.error('Add daily cost error:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

// @route   PUT /api/calves/:id
// @desc    Update calf
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    let calf = await Calf.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });

    if (!calf) {
      return res.status(404).json({ success: false, message: 'Calf not found' });
    }

    calf = await Calf.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate(['animalId', 'motherId']);

    res.json({ 
      success: true, 
      message: 'Calf updated successfully', 
      data: calf 
    });
  } catch (error) {
    console.error('Update calf error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   DELETE /api/calves/:id
// @desc    Delete calf
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const calf = await Calf.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });

    if (!calf) {
      return res.status(404).json({ success: false, message: 'Calf not found' });
    }

    await Calf.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Calf deleted successfully' });
  } catch (error) {
    console.error('Delete calf error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
