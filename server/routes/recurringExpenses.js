const express = require('express');
const router = express.Router();
const RecurringExpense = require('../models/RecurringExpense');
const auth = require('../middleware/auth');

// Get all recurring expenses for the authenticated user
router.get('/', auth, async (req, res) => {
  try {
    const { isActive } = req.query;
    const filter = { userId: req.user.id };
    
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }
    
    const expenses = await RecurringExpense.find(filter).sort({ expenseType: 1 });
    
    // Calculate total monthly cost (using base currency for consistent reporting)
    const activeExpenses = await RecurringExpense.find({ userId: req.user.id, isActive: true });
    let monthlyTotal = 0;

    activeExpenses.forEach(expense => {
      const amount = expense.expenseType === 'worker_wage'
        ? (expense.amountBase || expense.amount) * expense.workerCount
        : (expense.amountBase || expense.amount);

      switch(expense.frequency) {
        case 'daily':
          monthlyTotal += amount * 30;
          break;
        case '10_days':
          monthlyTotal += amount * 3;
          break;
        case 'monthly':
          monthlyTotal += amount;
          break;
      }
    });
    
    res.json({ 
      expenses, 
      summary: {
        totalActive: activeExpenses.length,
        estimatedMonthly: monthlyTotal
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching recurring expenses', error: error.message });
  }
});

// Create a new recurring expense
router.post('/', auth, async (req, res) => {
  try {
    const expenseData = {
      ...req.body,
      userId: req.user.id
    };

    // Set default currency if not provided
    if (!expenseData.currency) {
      expenseData.currency = 'INR';
      expenseData.exchangeRate = 1;
    }

    const expense = new RecurringExpense(expenseData);
    await expense.save();
    res.status(201).json(expense);
  } catch (error) {
    res.status(400).json({ message: 'Error creating recurring expense', error: error.message });
  }
});

// Update a recurring expense
router.put('/:id', auth, async (req, res) => {
  try {
    const expense = await RecurringExpense.findOne({ _id: req.params.id, userId: req.user.id });
    
    if (!expense) {
      return res.status(404).json({ message: 'Recurring expense not found' });
    }
    
    Object.assign(expense, req.body);
    await expense.save();
    res.json(expense);
  } catch (error) {
    res.status(400).json({ message: 'Error updating recurring expense', error: error.message });
  }
});

// Delete a recurring expense (soft delete)
router.delete('/:id', auth, async (req, res) => {
  try {
    const expense = await RecurringExpense.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { isActive: false },
      { new: true }
    );
    
    if (!expense) {
      return res.status(404).json({ message: 'Recurring expense not found' });
    }
    
    res.json({ message: 'Recurring expense deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting recurring expense', error: error.message });
  }
});

module.exports = router;
