const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const MilkProduction = require('../models/MilkProduction');
const MilkSale = require('../models/MilkSale');
const auth = require('../middleware/auth');

// ===== MILK PRODUCTION ROUTES =====

// @route   GET /api/milk/production
// @desc    Get all milk production records
// @access  Private
router.get('/production', auth, async (req, res) => {
  try {
    const { startDate, endDate, animalId } = req.query;
    
    let query = { userId: req.user._id };
    
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    if (animalId) {
      query.animalId = animalId;
    }

    const records = await MilkProduction.find(query)
      .populate('animalId', 'tagNumber name breed')
      .sort({ date: -1 });

    const totalYield = records.reduce((sum, record) => sum + record.totalYield, 0);

    res.json({ 
      success: true, 
      count: records.length,
      totalYield,
      data: records 
    });
  } catch (error) {
    console.error('Get milk production error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/milk/production
// @desc    Create new milk production record
// @access  Private
router.post(
  '/production',
  [
    auth,
    body('animalId').notEmpty().withMessage('Animal ID is required'),
    body('date').notEmpty().withMessage('Date is required'),
    body('morningYield').isFloat({ min: 0 }).withMessage('Morning yield must be positive'),
    body('eveningYield').isFloat({ min: 0 }).withMessage('Evening yield must be positive')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const productionData = {
        ...req.body,
        userId: req.user._id
      };

      const production = new MilkProduction(productionData);
      await production.save();

      await production.populate('animalId', 'tagNumber name breed');

      res.status(201).json({ 
        success: true, 
        message: 'Milk production record added successfully', 
        data: production 
      });
    } catch (error) {
      console.error('Create milk production error:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

// @route   PUT /api/milk/production/:id
// @desc    Update milk production record
// @access  Private
router.put('/production/:id', auth, async (req, res) => {
  try {
    let production = await MilkProduction.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });

    if (!production) {
      return res.status(404).json({ success: false, message: 'Record not found' });
    }

    production = await MilkProduction.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('animalId', 'tagNumber name breed');

    res.json({ 
      success: true, 
      message: 'Record updated successfully', 
      data: production 
    });
  } catch (error) {
    console.error('Update milk production error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   DELETE /api/milk/production/:id
// @desc    Delete milk production record
// @access  Private
router.delete('/production/:id', auth, async (req, res) => {
  try {
    const production = await MilkProduction.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });

    if (!production) {
      return res.status(404).json({ success: false, message: 'Record not found' });
    }

    await MilkProduction.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Record deleted successfully' });
  } catch (error) {
    console.error('Delete milk production error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ===== MILK SALES ROUTES =====

// @route   GET /api/milk/sales
// @desc    Get all milk sales
// @access  Private
router.get('/sales', auth, async (req, res) => {
  try {
    const { startDate, endDate, saleType, paymentStatus } = req.query;
    
    let query = { userId: req.user._id };
    
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    if (saleType) {
      query.saleType = saleType;
    }
    
    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }

    const sales = await MilkSale.find(query)
      .populate('contractId', 'vendorName ratePerLiter')
      .sort({ date: -1 });

    // Calculate summary by sale type (using base currency for consistent reporting)
    const summary = {
      totalQuantity: 0,
      totalRevenue: 0,
      bandhi: { quantity: 0, revenue: 0, count: 0 },
      mandi: { quantity: 0, revenue: 0, count: 0 },
      door_to_door: { quantity: 0, revenue: 0, count: 0 },
      pending: 0,
      received: 0
    };

    sales.forEach(sale => {
      summary.totalQuantity += sale.quantity;
      summary.totalRevenue += sale.totalAmountBase || sale.totalAmount;

      if (sale.saleType === 'bandhi') {
        summary.bandhi.quantity += sale.quantity;
        summary.bandhi.revenue += sale.totalAmountBase || sale.totalAmount;
        summary.bandhi.count++;
      } else if (sale.saleType === 'mandi') {
        summary.mandi.quantity += sale.quantity;
        summary.mandi.revenue += sale.totalAmountBase || sale.totalAmount;
        summary.mandi.count++;
      } else if (sale.saleType === 'door_to_door') {
        summary.door_to_door.quantity += sale.quantity;
        summary.door_to_door.revenue += sale.totalAmountBase || sale.totalAmount;
        summary.door_to_door.count++;
      }

      if (sale.paymentStatus === 'pending') {
        summary.pending += sale.totalAmountBase || sale.totalAmount;
      } else if (sale.paymentStatus === 'received') {
        summary.received += sale.totalAmountBase || sale.totalAmount;
      }
    });

    res.json({ 
      success: true, 
      count: sales.length,
      summary,
      data: sales 
    });
  } catch (error) {
    console.error('Get milk sales error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/milk/sales
// @desc    Create new milk sale
// @access  Private
router.post(
  '/sales',
  [
    auth,
    body('date').notEmpty().withMessage('Date is required'),
    body('quantity').isFloat({ min: 0 }).withMessage('Quantity must be positive'),
    body('saleType').isIn(['bandhi', 'mandi', 'door_to_door']).withMessage('Invalid sale type'),
    body('ratePerLiter').isFloat({ min: 0 }).withMessage('Rate must be positive'),
    body('currency').optional().isLength({ min: 3, max: 3 }).withMessage('Currency code must be 3 characters'),
    body('exchangeRate').optional().isFloat({ min: 0 }).withMessage('Exchange rate must be positive')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const saleData = {
        ...req.body,
        userId: req.user._id
      };

      // Set default currency if not provided
      if (!saleData.currency) {
        saleData.currency = 'INR';
        saleData.exchangeRate = 1;
      }

      const sale = new MilkSale(saleData);
      await sale.save();

      if (sale.contractId) {
        await sale.populate('contractId', 'vendorName ratePerLiter');
      }

      res.status(201).json({
        success: true,
        message: 'Milk sale recorded successfully',
        data: sale
      });
    } catch (error) {
      console.error('Create milk sale error:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

// @route   PUT /api/milk/sales/:id
// @desc    Update milk sale
// @access  Private
router.put('/sales/:id', auth, async (req, res) => {
  try {
    let sale = await MilkSale.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });

    if (!sale) {
      return res.status(404).json({ success: false, message: 'Sale not found' });
    }

    sale = await MilkSale.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({ 
      success: true, 
      message: 'Sale updated successfully', 
      data: sale 
    });
  } catch (error) {
    console.error('Update milk sale error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   DELETE /api/milk/sales/:id
// @desc    Delete milk sale
// @access  Private
router.delete('/sales/:id', auth, async (req, res) => {
  try {
    const sale = await MilkSale.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });

    if (!sale) {
      return res.status(404).json({ success: false, message: 'Sale not found' });
    }

    await MilkSale.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Sale deleted successfully' });
  } catch (error) {
    console.error('Delete milk sale error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
