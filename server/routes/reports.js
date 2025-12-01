const express = require('express');
const router = express.Router();
const MilkProduction = require('../models/MilkProduction');
const MilkSale = require('../models/MilkSale');
const Expense = require('../models/Expense');
const auth = require('../middleware/auth');

// @route   GET /api/reports/milk-yield
// @desc    Get monthly milk yield report with costs and profits
// @access  Private
router.get('/milk-yield', auth, async (req, res) => {
  try {
    const { year, month } = req.query;
    
    if (!year || !month) {
      return res.status(400).json({ 
        success: false, 
        message: 'Year and month are required' 
      });
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // Get milk production
    const production = await MilkProduction.find({
      userId: req.user._id,
      date: { $gte: startDate, $lte: endDate }
    }).populate('animalId', 'tagNumber name breed');

    // Get milk sales
    const sales = await MilkSale.find({
      userId: req.user._id,
      date: { $gte: startDate, $lte: endDate }
    });

    // Get expenses
    const expenses = await Expense.find({
      userId: req.user._id,
      date: { $gte: startDate, $lte: endDate }
    });

    // Calculate totals
    const totalYield = production.reduce((sum, p) => sum + p.totalYield, 0);
    const totalRevenue = sales.reduce((sum, s) => sum + s.totalAmount, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const profit = totalRevenue - totalExpenses;

    // Group by animal
    const animalYield = {};
    production.forEach(p => {
      const animalKey = p.animalId._id.toString();
      if (!animalYield[animalKey]) {
        animalYield[animalKey] = {
          animal: p.animalId,
          totalYield: 0,
          records: 0
        };
      }
      animalYield[animalKey].totalYield += p.totalYield;
      animalYield[animalKey].records += 1;
    });

    // Group sales by customer type
    const salesByType = sales.reduce((acc, sale) => {
      if (!acc[sale.customerType]) {
        acc[sale.customerType] = {
          quantity: 0,
          revenue: 0,
          count: 0
        };
      }
      acc[sale.customerType].quantity += sale.quantity;
      acc[sale.customerType].revenue += sale.totalAmount;
      acc[sale.customerType].count += 1;
      return acc;
    }, {});

    // Group expenses by category
    const expensesByCategory = expenses.reduce((acc, expense) => {
      if (!acc[expense.category]) {
        acc[expense.category] = 0;
      }
      acc[expense.category] += expense.amount;
      return acc;
    }, {});

    res.json({
      success: true,
      period: {
        year: parseInt(year),
        month: parseInt(month),
        startDate,
        endDate
      },
      summary: {
        totalYield,
        totalRevenue,
        totalExpenses,
        profit,
        profitMargin: totalRevenue > 0 ? ((profit / totalRevenue) * 100).toFixed(2) : 0
      },
      animalYield: Object.values(animalYield),
      salesByType,
      expensesByCategory,
      production,
      sales
    });
  } catch (error) {
    console.error('Milk yield report error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/reports/profit-loss
// @desc    Get profit and loss report
// @access  Private
router.get('/profit-loss', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ 
        success: false, 
        message: 'Start date and end date are required' 
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Get all sales (revenue)
    const sales = await MilkSale.find({
      userId: req.user._id,
      date: { $gte: start, $lte: end }
    });

    // Get all expenses
    const expenses = await Expense.find({
      userId: req.user._id,
      date: { $gte: start, $lte: end }
    });

    // Calculate revenue
    const totalRevenue = sales.reduce((sum, s) => sum + s.totalAmount, 0);
    const revenueByType = sales.reduce((acc, sale) => {
      if (!acc[sale.customerType]) {
        acc[sale.customerType] = 0;
      }
      acc[sale.customerType] += sale.totalAmount;
      return acc;
    }, {});

    // Calculate expenses
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const expensesByCategory = expenses.reduce((acc, expense) => {
      if (!acc[expense.category]) {
        acc[expense.category] = 0;
      }
      acc[expense.category] += expense.amount;
      return acc;
    }, {});

    // Calculate profit/loss
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(2) : 0;

    res.json({
      success: true,
      period: {
        startDate: start,
        endDate: end
      },
      revenue: {
        total: totalRevenue,
        byType: revenueByType
      },
      expenses: {
        total: totalExpenses,
        byCategory: expensesByCategory
      },
      profitLoss: {
        netProfit,
        profitMargin: parseFloat(profitMargin),
        status: netProfit >= 0 ? 'profit' : 'loss'
      }
    });
  } catch (error) {
    console.error('Profit/Loss report error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/reports/animal-performance
// @desc    Get animal performance report
// @access  Private
router.get('/animal-performance', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ 
        success: false, 
        message: 'Start date and end date are required' 
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    const production = await MilkProduction.find({
      userId: req.user._id,
      date: { $gte: start, $lte: end }
    }).populate('animalId', 'tagNumber name breed status');

    // Calculate performance by animal
    const animalPerformance = {};
    production.forEach(p => {
      const animalKey = p.animalId._id.toString();
      if (!animalPerformance[animalKey]) {
        animalPerformance[animalKey] = {
          animal: p.animalId,
          totalYield: 0,
          records: 0,
          averageYield: 0,
          maxYield: 0,
          minYield: Infinity
        };
      }
      const perf = animalPerformance[animalKey];
      perf.totalYield += p.totalYield;
      perf.records += 1;
      perf.maxYield = Math.max(perf.maxYield, p.totalYield);
      perf.minYield = Math.min(perf.minYield, p.totalYield);
    });

    // Calculate averages
    Object.values(animalPerformance).forEach(perf => {
      perf.averageYield = perf.totalYield / perf.records;
      if (perf.minYield === Infinity) perf.minYield = 0;
    });

    res.json({
      success: true,
      period: {
        startDate: start,
        endDate: end
      },
      animalPerformance: Object.values(animalPerformance).sort((a, b) => b.totalYield - a.totalYield)
    });
  } catch (error) {
    console.error('Animal performance report error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/reports/customer-sales-history
// @desc    Get customer sales history report with daily breakdown
// @access  Private
router.get('/customer-sales-history', auth, async (req, res) => {
  try {
    const { customerName, startDate, endDate } = req.query;
    
    if (!customerName) {
      return res.status(400).json({ 
        success: false, 
        message: 'Customer name is required' 
      });
    }

    if (!startDate || !endDate) {
      return res.status(400).json({ 
        success: false, 
        message: 'Start date and end date are required' 
      });
    }

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // Escape special regex characters
    const escapedName = customerName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Find direct sales by customer name
    let sales = await MilkSale.find({
      userId: req.user._id,
      customerName: { $regex: new RegExp(`^\\s*${escapedName}\\s*$`, 'i') },
      date: { $gte: start, $lte: end }
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
        date: { $gte: start, $lte: end }
      }).sort({ date: 1 });
      
      // Merge and remove duplicates
      const existingIds = new Set(sales.map(s => s._id.toString()));
      for (const sale of bandhiSales) {
        if (!existingIds.has(sale._id.toString())) {
          sales.push(sale);
        }
      }
      sales.sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    if (sales.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'No sales found for this customer in the selected period' 
      });
    }

    // Group by date and time of day
    const salesByDate = {};
    sales.forEach(sale => {
      const dateKey = new Date(sale.date).toISOString().split('T')[0];
      if (!salesByDate[dateKey]) {
        salesByDate[dateKey] = {
          date: dateKey,
          morning: { quantity: 0, amount: 0, rate: 0, count: 0 },
          evening: { quantity: 0, amount: 0, rate: 0, count: 0 },
          allDay: { quantity: 0, amount: 0, rate: 0, count: 0 },
          totalQuantity: 0,
          totalAmount: 0,
          amountPaid: 0,
          amountPending: 0,
          sales: []
        };
      }

      const dateData = salesByDate[dateKey];
      const timeOfDay = sale.timeOfDay || 'allDay';
      
      if (timeOfDay === 'morning' || timeOfDay === 'evening') {
        dateData[timeOfDay].quantity += sale.quantity;
        dateData[timeOfDay].amount += sale.totalAmount;
        dateData[timeOfDay].rate = sale.ratePerLiter;
        dateData[timeOfDay].count += 1;
      } else {
        dateData.allDay.quantity += sale.quantity;
        dateData.allDay.amount += sale.totalAmount;
        dateData.allDay.rate = sale.ratePerLiter;
        dateData.allDay.count += 1;
      }

      dateData.totalQuantity += sale.quantity;
      dateData.totalAmount += sale.totalAmount;
      dateData.amountPaid += sale.amountPaid || 0;
      dateData.amountPending += sale.amountPending || (sale.totalAmount - (sale.amountPaid || 0));
      dateData.sales.push({
        _id: sale._id,
        timeOfDay: sale.timeOfDay,
        quantity: sale.quantity,
        ratePerLiter: sale.ratePerLiter,
        totalAmount: sale.totalAmount,
        amountPaid: sale.amountPaid || 0,
        amountPending: sale.amountPending || (sale.totalAmount - (sale.amountPaid || 0)),
        paymentStatus: sale.paymentStatus,
        saleType: sale.saleType
      });
    });

    // Calculate summary
    const totalQuantity = sales.reduce((sum, s) => sum + s.quantity, 0);
    const totalAmount = sales.reduce((sum, s) => sum + s.totalAmount, 0);
    const totalPaid = sales.reduce((sum, s) => sum + (s.amountPaid || 0), 0);
    const totalPending = totalAmount - totalPaid;
    const averageRate = totalQuantity > 0 ? totalAmount / totalQuantity : 0;

    res.json({
      success: true,
      customerName,
      period: {
        startDate: start,
        endDate: end
      },
      summary: {
        totalSales: sales.length,
        totalQuantity: parseFloat(totalQuantity.toFixed(2)),
        totalAmount: parseFloat(totalAmount.toFixed(2)),
        totalPaid: parseFloat(totalPaid.toFixed(2)),
        totalPending: parseFloat(totalPending.toFixed(2)),
        averageRate: parseFloat(averageRate.toFixed(2))
      },
      salesByDate: Object.values(salesByDate).sort((a, b) => new Date(b.date) - new Date(a.date)),
      allSales: sales
    });
  } catch (error) {
    console.error('Customer sales history report error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
