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

    // Update the document fields
    Object.assign(production, req.body);
    
    // Ensure totalYield is calculated correctly based on morning and evening yields
    if (req.body.morningYield !== undefined || req.body.eveningYield !== undefined) {
      const morning = production.morningYield !== undefined && production.morningYield !== null ? Number(production.morningYield) : 0;
      const evening = production.eveningYield !== undefined && production.eveningYield !== null ? Number(production.eveningYield) : 0;
      production.morningYield = isNaN(morning) ? 0 : morning;
      production.eveningYield = isNaN(evening) ? 0 : evening;
      production.totalYield = production.morningYield + production.eveningYield;
    }
    
    // Save the document to persist changes
    production = await production.save();
    
    // Populate the animal data
    await production.populate('animalId', 'tagNumber name breed');

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

// @route   POST /api/milk/sales/:id/payments
// @desc    Add payment to a milk sale
// @access  Private
router.post(
  '/sales/:id/payments',
  [
    auth,
    body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be positive'),
    body('paymentMethod').optional().isIn(['cash', 'bank_transfer', 'cheque', 'other']).withMessage('Invalid payment method'),
    body('date').optional().isISO8601().withMessage('Invalid date format'),
    body('notes').optional().isString()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const sale = await MilkSale.findOne({ 
        _id: req.params.id, 
        userId: req.user._id 
      });

      if (!sale) {
        return res.status(404).json({ success: false, message: 'Sale not found' });
      }

      const payment = {
        amount: req.body.amount,
        date: req.body.date || new Date(),
        paymentMethod: req.body.paymentMethod || 'cash',
        notes: req.body.notes || ''
      };

      sale.payments.push(payment);
      sale.customerName = sale.customerName || req.body.customerName;
      await sale.save(); // This triggers the pre-save hook to update payment status

      res.json({ 
        success: true, 
        message: 'Payment added successfully', 
        data: sale 
      });
    } catch (error) {
      console.error('Add payment error:', error);
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

    // Only modify payment status if it's explicitly being changed
    // If payment status is being changed to pending, clear all payments
    if (req.body.paymentStatus === 'pending' && sale.paymentStatus !== 'pending') {
      sale.payments = [];
      sale.amountPaid = 0;
      sale.amountPending = sale.totalAmount;
      sale.paymentStatus = 'pending';
      // Update other fields from req.body
      Object.keys(req.body).forEach(key => {
        if (key !== 'paymentStatus' && key !== 'payments' && key !== 'amountPaid' && key !== 'amountPending') {
          sale[key] = req.body[key];
        }
      });
      await sale.save();
      
      return res.json({ 
        success: true, 
        message: 'Payment reverted to pending', 
        data: sale 
      });
    }

    // If payment status is being changed to received, mark full payment
    if (req.body.paymentStatus === 'received' && sale.paymentStatus !== 'received') {
      const pendingAmount = sale.totalAmount - (sale.amountPaid || 0);
      if (pendingAmount > 0) {
        sale.payments.push({
          amount: pendingAmount,
          date: new Date(),
          paymentMethod: 'cash',
          notes: 'Marked as fully paid'
        });
      }
      // Update other fields from req.body
      Object.keys(req.body).forEach(key => {
        if (key !== 'paymentStatus' && key !== 'payments' && key !== 'amountPaid' && key !== 'amountPending') {
          sale[key] = req.body[key];
        }
      });
      await sale.save();
      
      return res.json({ 
        success: true, 
        message: 'Sale marked as fully paid', 
        data: sale 
      });
    }

    // For partial status or when status is not being changed, preserve existing payments
    // Only update payment status if it's explicitly different
    if (req.body.paymentStatus && req.body.paymentStatus !== sale.paymentStatus) {
      // Status is being changed but not to pending or received (e.g., to partial)
      sale.paymentStatus = req.body.paymentStatus;
    }
    
    // Update other fields but preserve payments, amountPaid, and amountPending unless explicitly changed
    Object.keys(req.body).forEach(key => {
      if (key !== 'payments' && key !== 'amountPaid' && key !== 'amountPending') {
        sale[key] = req.body[key];
      }
    });
    
    // Recalculate totalAmount if quantity or rate changed
    if (req.body.quantity !== undefined || req.body.ratePerLiter !== undefined) {
      const quantity = req.body.quantity !== undefined ? Number(req.body.quantity) : sale.quantity;
      const ratePerLiter = req.body.ratePerLiter !== undefined ? Number(req.body.ratePerLiter) : sale.ratePerLiter;
      const packagingCost = req.body.packagingCost !== undefined ? Number(req.body.packagingCost || 0) : (sale.packagingCost || 0);
      sale.totalAmount = (quantity * ratePerLiter) + (quantity * packagingCost);
      // Recalculate amountPending if payments are preserved
      if (sale.paymentStatus === 'partial' || sale.paymentStatus === 'received') {
        sale.amountPending = Math.max(0, sale.totalAmount - (sale.amountPaid || 0));
      } else {
        sale.amountPending = sale.totalAmount;
      }
    }
    
    await sale.save();

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

// @route   POST /api/milk/sales/auto-allocate-payment
// @desc    Auto-allocate payment to pending sales by customer (FIFO)
// @access  Private
router.post(
  '/sales/auto-allocate-payment',
  [
    auth,
    body('customerName').notEmpty().withMessage('Customer name is required'),
    body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be positive'),
    body('paymentMethod').optional().isIn(['cash', 'bank_transfer', 'cheque', 'other']).withMessage('Invalid payment method'),
    body('date').optional().isISO8601().withMessage('Invalid date format')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { customerName, amount, paymentMethod, date } = req.body;

      // Escape special regex characters in customer name
      const escapedName = customerName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      // Find all pending/partial sales for this customer, sorted by date (FIFO)
      // First, find by direct customerName match (case insensitive, trim whitespace)
      let pendingSales = await MilkSale.find({
        userId: req.user._id,
        customerName: { $regex: new RegExp(`^\\s*${escapedName}\\s*$`, 'i') },
        paymentStatus: { $in: ['pending', 'partial'] }
      }).sort({ date: 1 });

      // Also find bandhi sales where contract vendor name matches
      const Contract = require('../models/Contract');
      const matchingContracts = await Contract.find({
        userId: req.user._id,
        vendorName: { $regex: new RegExp(`^\\s*${escapedName}\\s*$`, 'i') }
      });

      if (matchingContracts.length > 0) {
        const contractIds = matchingContracts.map(c => c._id);
        const bandhiSales = await MilkSale.find({
          userId: req.user._id,
          contractId: { $in: contractIds },
          paymentStatus: { $in: ['pending', 'partial'] }
        }).sort({ date: 1 });
        
        // Merge and remove duplicates (by _id), then sort by date
        const existingIds = new Set(pendingSales.map(s => s._id.toString()));
        for (const sale of bandhiSales) {
          if (!existingIds.has(sale._id.toString())) {
            pendingSales.push(sale);
          }
        }
        pendingSales.sort((a, b) => new Date(a.date) - new Date(b.date));
      }

      if (pendingSales.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'No pending sales found for this customer',
          debug: {
            customerSearched: customerName,
            contractsFound: matchingContracts.length
          }
        });
      }

      let remainingAmount = Number(amount);
      const updatedSales = [];

      for (const sale of pendingSales) {
        if (remainingAmount <= 0) break;

        // Calculate pending amount manually in case it's not set
        const totalPaid = sale.payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
        const pendingAmount = Math.max(0, Number(sale.totalAmount) - totalPaid);
        
        if (pendingAmount <= 0) continue; // Skip if already paid
        
        const amountToPay = Math.min(remainingAmount, pendingAmount);
        
        // Ensure amountToPay is a valid number
        if (isNaN(amountToPay) || amountToPay <= 0) {
          console.warn(`Invalid amountToPay for sale ${sale._id}: ${amountToPay}`);
          continue;
        }
        
        sale.payments.push({
          amount: amountToPay,
          date: date || new Date(),
          paymentMethod: paymentMethod || 'cash',
          notes: 'Auto-allocated from bulk payment'
        });

        await sale.save();
        remainingAmount -= amountToPay;
        updatedSales.push(sale);
      }

      res.json({ 
        success: true, 
        message: `Payment of Rs ${amount} allocated to ${updatedSales.length} sale(s)`,
        remainingAmount: remainingAmount > 0 ? remainingAmount : 0,
        data: updatedSales 
      });
    } catch (error) {
      console.error('Auto-allocate payment error:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

module.exports = router;
