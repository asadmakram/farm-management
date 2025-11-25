const express = require('express');
const router = express.Router();
const Animal = require('../models/Animal');
const MilkProduction = require('../models/MilkProduction');
const MilkSale = require('../models/MilkSale');
const Expense = require('../models/Expense');
const Vaccination = require('../models/Vaccination');
const Calf = require('../models/Calf');
const auth = require('../middleware/auth');

// @route   GET /api/dashboard
// @desc    Get dashboard overview data
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get date ranges
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);
    
    const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59);

    // Get animal statistics
    const totalAnimals = await Animal.countDocuments({ userId, status: 'active' });
    const maleAnimals = await Animal.countDocuments({ userId, status: 'active', gender: 'male' });
    const femaleAnimals = await Animal.countDocuments({ userId, status: 'active', gender: 'female' });
    
    // Get milk production statistics
    const todayProduction = await MilkProduction.find({
      userId,
      date: { $gte: today }
    });
    const todayYield = todayProduction.reduce((sum, p) => sum + p.totalYield, 0);

    const monthProduction = await MilkProduction.find({
      userId,
      date: { $gte: startOfMonth, $lte: endOfMonth }
    });
    const monthYield = monthProduction.reduce((sum, p) => sum + p.totalYield, 0);

    const lastMonthProduction = await MilkProduction.find({
      userId,
      date: { $gte: startOfLastMonth, $lte: endOfLastMonth }
    });
    const lastMonthYield = lastMonthProduction.reduce((sum, p) => sum + p.totalYield, 0);

    // Calculate yield trend
    const yieldTrend = lastMonthYield > 0 
      ? (((monthYield - lastMonthYield) / lastMonthYield) * 100).toFixed(2)
      : 0;

    // Get sales statistics
    const monthSales = await MilkSale.find({
      userId,
      date: { $gte: startOfMonth, $lte: endOfMonth }
    });
    const monthRevenue = monthSales.reduce((sum, s) => sum + s.totalAmount, 0);
    const monthSalesQuantity = monthSales.reduce((sum, s) => sum + s.quantity, 0);

    const totalSales = await MilkSale.find({ userId });
    const totalRevenue = totalSales.reduce((sum, s) => sum + s.totalAmount, 0);

    const lastMonthSales = await MilkSale.find({
      userId,
      date: { $gte: startOfLastMonth, $lte: endOfLastMonth }
    });
    const lastMonthRevenue = lastMonthSales.reduce((sum, s) => sum + s.totalAmount, 0);

    // Calculate revenue trend
    const revenueTrend = lastMonthRevenue > 0 
      ? (((monthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100).toFixed(2)
      : 0;

    // Get expense statistics
    const monthExpenses = await Expense.find({
      userId,
      date: { $gte: startOfMonth, $lte: endOfMonth }
    });
    const monthTotalExpenses = monthExpenses.reduce((sum, e) => sum + e.amount, 0);

    const totalExpenses = await Expense.find({ userId });
    const totalExpensesAmount = totalExpenses.reduce((sum, e) => sum + e.amount, 0);

    const expensesByCategory = monthExpenses.reduce((acc, expense) => {
      if (!acc[expense.category]) {
        acc[expense.category] = 0;
      }
      acc[expense.category] += expense.amount;
      return acc;
    }, {});

    // Calculate profit
    const monthProfit = monthRevenue - monthTotalExpenses;
    const totalProfit = totalRevenue - totalExpensesAmount;
    const profitMargin = monthRevenue > 0 ? ((monthProfit / monthRevenue) * 100).toFixed(2) : 0;

    // Calculate average daily milk production for this month
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const averageDaily = daysInMonth > 0 ? (monthYield / daysInMonth).toFixed(2) : 0;

    // Get upcoming vaccinations (next 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    const upcomingVaccinations = await Vaccination.find({
      userId,
      nextDueDate: { 
        $gte: today, 
        $lte: thirtyDaysFromNow 
      }
    })
      .populate('animalId', 'tagNumber name')
      .sort({ nextDueDate: 1 })
      .limit(5);

    // Get recent calves (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentCalves = await Calf.find({
      userId,
      birthDate: { $gte: thirtyDaysAgo }
    })
      .populate('animalId', 'tagNumber name')
      .populate('motherId', 'tagNumber name')
      .sort({ birthDate: -1 });

    // Get last 7 days production trend
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const weekProduction = await MilkProduction.aggregate([
      {
        $match: {
          userId,
          date: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          totalYield: { $sum: "$totalYield" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get sales distribution by customer type
    const salesByType = monthSales.reduce((acc, sale) => {
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

    res.json({
      success: true,
      dashboard: {
        animals: {
          total: totalAnimals,
          male: maleAnimals,
          female: femaleAnimals
        },
        milk: {
          thisMonth: monthYield,
          averageDaily: parseFloat(averageDaily)
        },
        sales: {
          thisMonth: monthRevenue,
          total: totalRevenue
        },
        expenses: {
          thisMonth: monthTotalExpenses,
          total: totalExpensesAmount
        },
        profitLoss: {
          thisMonth: monthProfit,
          total: totalProfit
        },
        alerts: {
          upcomingVaccinations,
          recentCalves
        }
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
