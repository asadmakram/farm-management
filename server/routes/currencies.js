const express = require('express');
const router = express.Router();
const Currency = require('../models/Currency');
const auth = require('../middleware/auth');

// Get all currencies for a user
router.get('/', auth, async (req, res) => {
  try {
    const currencies = await Currency.find({
      userId: req.user.userId,
      isActive: true
    }).sort({ isDefault: -1, name: 1 });

    res.json({
      success: true,
      currencies
    });
  } catch (error) {
    console.error('Error fetching currencies:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching currencies'
    });
  }
});

// Get default currency for a user
router.get('/default', auth, async (req, res) => {
  try {
    const currency = await Currency.findOne({
      userId: req.user.userId,
      isDefault: true,
      isActive: true
    });

    if (!currency) {
      // Return INR as default if no default currency is set
      return res.json({
        success: true,
        currency: {
          code: 'INR',
          name: 'Indian Rupee',
          symbol: '₹',
          exchangeRate: 1,
          isDefault: true
        }
      });
    }

    res.json({
      success: true,
      currency
    });
  } catch (error) {
    console.error('Error fetching default currency:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching default currency'
    });
  }
});

// Create a new currency
router.post('/', auth, async (req, res) => {
  try {
    const { code, name, symbol, exchangeRate, isDefault } = req.body;

    // Validate required fields
    if (!code || !name || !symbol || exchangeRate === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Code, name, symbol, and exchange rate are required'
      });
    }

    // Check if currency code already exists for this user
    const existingCurrency = await Currency.findOne({
      userId: req.user.userId,
      code: code.toUpperCase()
    });

    if (existingCurrency) {
      return res.status(400).json({
        success: false,
        message: 'Currency code already exists'
      });
    }

    const currency = new Currency({
      userId: req.user.userId,
      code: code.toUpperCase(),
      name,
      symbol,
      exchangeRate: Number(exchangeRate),
      isDefault: Boolean(isDefault)
    });

    await currency.save();

    res.status(201).json({
      success: true,
      message: 'Currency created successfully',
      currency
    });
  } catch (error) {
    console.error('Error creating currency:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating currency'
    });
  }
});

// Update a currency
router.put('/:id', auth, async (req, res) => {
  try {
    const { code, name, symbol, exchangeRate, isDefault } = req.body;

    const currency = await Currency.findOne({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!currency) {
      return res.status(404).json({
        success: false,
        message: 'Currency not found'
      });
    }

    // Update fields
    if (code) currency.code = code.toUpperCase();
    if (name) currency.name = name;
    if (symbol) currency.symbol = symbol;
    if (exchangeRate !== undefined) currency.exchangeRate = Number(exchangeRate);
    if (isDefault !== undefined) currency.isDefault = Boolean(isDefault);

    await currency.save();

    res.json({
      success: true,
      message: 'Currency updated successfully',
      currency
    });
  } catch (error) {
    console.error('Error updating currency:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating currency'
    });
  }
});

// Delete a currency (soft delete)
router.delete('/:id', auth, async (req, res) => {
  try {
    const currency = await Currency.findOne({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!currency) {
      return res.status(404).json({
        success: false,
        message: 'Currency not found'
      });
    }

    // Check if currency is being used in transactions
    const MilkSale = require('../models/MilkSale');
    const Contract = require('../models/Contract');
    const RecurringExpense = require('../models/RecurringExpense');
    const Expense = require('../models/Expense');

    const [salesCount, contractsCount, recurringExpensesCount, expensesCount] = await Promise.all([
      MilkSale.countDocuments({ userId: req.user.userId, currency: currency.code }),
      Contract.countDocuments({ userId: req.user.userId, currency: currency.code }),
      RecurringExpense.countDocuments({ userId: req.user.userId, currency: currency.code }),
      Expense.countDocuments({ userId: req.user.userId, currency: currency.code })
    ]);

    if (salesCount > 0 || contractsCount > 0 || recurringExpensesCount > 0 || expensesCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete currency that is being used in transactions'
      });
    }

    currency.isActive = false;
    await currency.save();

    res.json({
      success: true,
      message: 'Currency deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting currency:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting currency'
    });
  }
});

// Initialize default currencies for a new user
router.post('/initialize', auth, async (req, res) => {
  try {
    const defaultCurrencies = [
      { code: 'INR', name: 'Indian Rupee', symbol: '₹', exchangeRate: 1, isDefault: true },
      { code: 'USD', name: 'US Dollar', symbol: '$', exchangeRate: 83.5, isDefault: false },
      { code: 'EUR', name: 'Euro', symbol: '€', exchangeRate: 90.2, isDefault: false },
      { code: 'GBP', name: 'British Pound', symbol: '£', exchangeRate: 105.8, isDefault: false },
      { code: 'PKR', name: 'Pakistani Rupee', symbol: '₨', exchangeRate: 0.3, isDefault: false }
    ];

    const currencies = await Promise.all(
      defaultCurrencies.map(async (curr) => {
        const existing = await Currency.findOne({
          userId: req.user.userId,
          code: curr.code
        });

        if (!existing) {
          const currency = new Currency({
            userId: req.user.userId,
            ...curr
          });
          return currency.save();
        }
        return existing;
      })
    );

    res.json({
      success: true,
      message: 'Currencies initialized successfully',
      currencies
    });
  } catch (error) {
    console.error('Error initializing currencies:', error);
    res.status(500).json({
      success: false,
      message: 'Error initializing currencies'
    });
  }
});

module.exports = router;