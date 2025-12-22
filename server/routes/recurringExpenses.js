const express = require('express');
const router = express.Router();
const RecurringExpense = require('../models/RecurringExpense');
const Notification = require('../models/Notification');
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
    console.error('Error fetching recurring expenses', error);
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

    // Create a notification for the next purchase date (alert 2 days before)
    try {
      if (expense.nextPurchaseDate) {
        const due = new Date(expense.nextPurchaseDate);
        const alertDate = new Date(due);
        alertDate.setDate(due.getDate() - 2);

        await Notification.create({
          userId: expense.userId,
          recurringExpenseId: expense._id,
          title: `Upcoming expense: ${expense.expenseType}`,
          message: expense.description || `Recurring expense of ₹${expense.amount}`,
          dueDate: due,
          alertDate,
          isSent: false
        });
      }
    } catch (err) {
      // Don't fail the request if notification creation fails. Log for later inspection.
      console.error('Error creating notification for recurring expense:', err.message);
    }

    res.status(201).json(expense);
  } catch (error) {
    console.error('Error creating recurring expense', error);
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
    
    const prevNext = expense.nextPurchaseDate ? new Date(expense.nextPurchaseDate) : null;
    Object.assign(expense, req.body);
    await expense.save();

    // If nextPurchaseDate changed, update/create notification
    try {
      const newNext = expense.nextPurchaseDate ? new Date(expense.nextPurchaseDate) : null;
      if (newNext && (!prevNext || newNext.getTime() !== prevNext.getTime())) {
        const alertDate = new Date(newNext);
        alertDate.setDate(newNext.getDate() - 2);

        // Try to find existing notification for this recurring expense and update it
        const existing = await Notification.findOne({ recurringExpenseId: expense._id });
        if (existing) {
          existing.dueDate = newNext;
          existing.alertDate = alertDate;
          existing.title = `Upcoming expense: ${expense.expenseType}`;
          existing.message = expense.description || `Recurring expense of ₹${expense.amount}`;
          existing.isSent = false;
          existing.isRead = false;
          await existing.save();
        } else {
          await Notification.create({
            userId: expense.userId,
            recurringExpenseId: expense._id,
            title: `Upcoming expense: ${expense.expenseType}`,
            message: expense.description || `Recurring expense of ₹${expense.amount}`,
            dueDate: newNext,
            alertDate,
            isSent: false
          });
        }
      }
    } catch (err) {
      console.error('Error updating/creating notification for recurring expense:', err.message);
    }

    res.json(expense);
  } catch (error) {
    console.error('Error updating recurring expense', error);
    res.status(400).json({ message: 'Error updating recurring expense', error: error.message });
  }
});

// Delete a recurring expense
router.delete('/:id', auth, async (req, res) => {
  try {
    const expense = await RecurringExpense.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    
    if (!expense) {
      return res.status(404).json({ message: 'Recurring expense not found' });
    }
    
    res.json({ message: 'Recurring expense deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting recurring expense', error: error.message });
  }
});

module.exports = router;
