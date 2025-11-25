const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Expense = require('../models/Expense');
const auth = require('../middleware/auth');

// @route   GET /api/expenses
// @desc    Get all expenses for user with filtering
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { startDate, endDate, category, expenseType } = req.query;
    
    let query = { userId: req.user._id };
    
    // Add date range filter
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    // Add category filter
    if (category) {
      query.category = category;
    }

    // Add expense type filter
    if (expenseType) {
      query.expenseType = expenseType;
    }

    const expenses = await Expense.find(query)
      .populate('animalId', 'tagNumber name')
      .sort({ date: -1 });

    const totalAmount = expenses.reduce((sum, expense) => sum + (expense.amountBase || expense.amount), 0);

    // Segregate by expense type
    const assetExpenses = expenses.filter(e => e.expenseType === 'asset');
    const operatingExpenses = expenses.filter(e => e.expenseType === 'operating');

    const totalAssets = assetExpenses.reduce((sum, e) => sum + (e.amountBase || e.amount), 0);
    const totalOperating = operatingExpenses.reduce((sum, e) => sum + (e.amountBase || e.amount), 0);

    res.json({ 
      success: true, 
      count: expenses.length,
      totalAmount,
      summary: {
        totalAssets,
        totalOperating,
        assetCount: assetExpenses.length,
        operatingCount: operatingExpenses.length
      },
      data: expenses 
    });
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/expenses
// @desc    Create new expense
// @access  Private
router.post(
  '/',
  [
    auth,
    body('date').notEmpty().withMessage('Date is required'),
    body('category').notEmpty().withMessage('Category is required'),
    body('animalId').optional({ nullable: true }).isMongoId().withMessage('Invalid animal ID'),
    body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
    body('currency').optional().isLength({ min: 3, max: 3 }).withMessage('Currency code must be 3 characters'),
    body('exchangeRate').optional().isFloat({ min: 0 }).withMessage('Exchange rate must be positive')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      // sanitize animalId to avoid casting empty string to ObjectId
      const bodyData = { ...req.body };
      if (bodyData.animalId === '' || bodyData.animalId === null) {
        delete bodyData.animalId;
      }

      const expenseData = {
        ...bodyData,
        userId: req.user._id
      };

      // Set default currency if not provided
      if (!expenseData.currency) {
        expenseData.currency = 'INR';
        expenseData.exchangeRate = 1;
      }

      const expense = new Expense(expenseData);
      await expense.save();

      res.status(201).json({
        success: true,
        message: 'Expense added successfully',
        data: expense
      });
    } catch (error) {
      console.error('Create expense error:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

// @route   PUT /api/expenses/:id
// @desc    Update expense
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    let expense = await Expense.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });

    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    const bodyData = { ...req.body };
    if (bodyData.animalId === '' || bodyData.animalId === null) {
      delete bodyData.animalId;
    }

    expense = await Expense.findByIdAndUpdate(
      req.params.id,
      bodyData,
      { new: true, runValidators: true }
    );

    res.json({ 
      success: true, 
      message: 'Expense updated successfully', 
      data: expense 
    });
  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   DELETE /api/expenses/:id
// @desc    Delete expense
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const expense = await Expense.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });

    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    await Expense.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
