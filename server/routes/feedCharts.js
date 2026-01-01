const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const FeedChart = require('../models/FeedChart');
const FeedItem = require('../models/FeedItem');

// Create a new feed chart
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, numberOfAnimals, animalType, feedItems, calculationNotes, isTemplate } = req.body;
    
    // Validate that all feed items exist
    for (const item of feedItems) {
      const feedItem = await FeedItem.findOne({ _id: item.feedItemId, userId: req.user.id });
      if (!feedItem) {
        return res.status(404).json({ error: `Feed item ${item.feedItemId} not found` });
      }
    }
    
    const feedChart = new FeedChart({
      userId: req.user.id,
      name,
      numberOfAnimals,
      feedItems
    });
    
    await feedChart.save();
    res.status(201).json(feedChart);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all feed charts for a user
router.get('/', auth, async (req, res) => {
  try {
    const feedCharts = await FeedChart.find({ userId: req.user.id }).populate('feedItems.feedItemId');
    res.json(feedCharts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a specific feed chart by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const feedChart = await FeedChart.findOne({ _id: req.params.id, userId: req.user.id }).populate('feedItems.feedItemId');
    if (!feedChart) {
      return res.status(404).json({ error: 'Feed chart not found' });
    }
    res.json(feedChart);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a feed chart
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, numberOfAnimals, feedItems } = req.body;
    
    // Validate that all feed items exist
    for (const item of feedItems) {
      const feedItem = await FeedItem.findOne({ _id: item.feedItemId, userId: req.user.id });
      if (!feedItem) {
        return res.status(404).json({ error: `Feed item ${item.feedItemId} not found` });
      }
    }
    
    const feedChart = await FeedChart.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { name, numberOfAnimals, feedItems },
      { new: true, runValidators: true }
    ).populate('feedItems.feedItemId');
    
    if (!feedChart) {
      return res.status(404).json({ error: 'Feed chart not found' });
    }
    
    res.json(feedChart);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete a feed chart
router.delete('/:id', auth, async (req, res) => {
  try {
    const feedChart = await FeedChart.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!feedChart) {
      return res.status(404).json({ error: 'Feed chart not found' });
    }
    
    res.json({ message: 'Feed chart deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get cost calculations for a feed chart
router.get('/:id/calculations', auth, async (req, res) => {
  try {
    const feedChart = await FeedChart.findOne({ _id: req.params.id, userId: req.user.id }).populate('feedItems.feedItemId');
    if (!feedChart) {
      return res.status(404).json({ error: 'Feed chart not found' });
    }

    // Calculate costs for 10, 20, and 30 days
    // Assuming 2 feedings per day
    const calculations = {
      perDay: {
        totalQuantity: 0,
        totalCost: 0,
        feedItems: []
      },
      per10Days: {
        totalQuantity: 0,
        totalCost: 0,
        feedItems: []
      },
      per20Days: {
        totalQuantity: 0,
        totalCost: 0,
        feedItems: []
      },
      per30Days: {
        totalQuantity: 0,
        totalCost: 0,
        feedItems: []
      }
    };

    // Calculate per day (2 times per day)
    feedChart.feedItems.forEach(item => {
      const quantityPerDay = item.quantityPerTime * 2; // 2 times per day
      const costPerDay = quantityPerDay * (item.feedItemId.pricePerBag / item.feedItemId.quantityPerBag);
      
      calculations.perDay.totalQuantity += quantityPerDay;
      calculations.perDay.totalCost += costPerDay;
      
      // Store individual feed item calculations
      calculations.perDay.feedItems.push({
        feedItemId: item.feedItemId._id,
        feedItemName: item.feedItemId.name,
        quantityPerDay,
        costPerDay
      });
    });

    // Calculate for different durations
    calculations.per10Days.totalQuantity = calculations.perDay.totalQuantity * 10;
    calculations.per10Days.totalCost = calculations.perDay.totalCost * 10;
    
    calculations.per20Days.totalQuantity = calculations.perDay.totalQuantity * 20;
    calculations.per20Days.totalCost = calculations.perDay.totalCost * 20;
    
    calculations.per30Days.totalQuantity = calculations.perDay.totalQuantity * 30;
    calculations.per30Days.totalCost = calculations.perDay.totalCost * 30;
    
    // Calculate individual feed item quantities for different durations
    calculations.perDay.feedItems.forEach(feedItem => {
      calculations.per10Days.feedItems.push({
        feedItemId: feedItem.feedItemId,
        feedItemName: feedItem.feedItemName,
        quantity: feedItem.quantityPerDay * 10,
        cost: feedItem.costPerDay * 10
      });
      
      calculations.per20Days.feedItems.push({
        feedItemId: feedItem.feedItemId,
        feedItemName: feedItem.feedItemName,
        quantity: feedItem.quantityPerDay * 20,
        cost: feedItem.costPerDay * 20
      });
      
      calculations.per30Days.feedItems.push({
        feedItemId: feedItem.feedItemId,
        feedItemName: feedItem.feedItemName,
        quantity: feedItem.quantityPerDay * 30,
        cost: feedItem.costPerDay * 30
      });
    });
    
    // Multiply by number of animals
    calculations.perDay.totalCost *= feedChart.numberOfAnimals;
    calculations.per10Days.totalCost *= feedChart.numberOfAnimals;
    calculations.per20Days.totalCost *= feedChart.numberOfAnimals;
    calculations.per30Days.totalCost *= feedChart.numberOfAnimals;
    
    // Multiply individual feed item costs by number of animals
    [calculations.perDay, calculations.per10Days, calculations.per20Days, calculations.per30Days].forEach(period => {
      period.feedItems.forEach(feedItem => {
        feedItem.cost *= feedChart.numberOfAnimals;
      });
    });

    res.json({
      feedChart,
      calculations
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get cost calculations for a feed chart for a specific duration
router.get('/:id/calculations/:duration', auth, async (req, res) => {
  try {
    const feedChart = await FeedChart.findOne({ _id: req.params.id, userId: req.user.id }).populate('feedItems.feedItemId');
    if (!feedChart) {
      return res.status(404).json({ error: 'Feed chart not found' });
    }
    
    const { duration } = req.params;
    const validDurations = ['10', '20', '30'];
    
    if (!validDurations.includes(duration)) {
      return res.status(400).json({ error: 'Invalid duration. Must be 10, 20, or 30 days' });
    }
    
    // Calculate costs for the specified duration
    const days = parseInt(duration);
    const calculations = {
      duration,
      totalQuantity: 0,
      totalCost: 0,
      feedItems: []
    };
    
    // Calculate per day (2 times per day) and then multiply by duration
    feedChart.feedItems.forEach(item => {
      const quantityPerDay = item.quantityPerTime * 2; // 2 times per day
      const costPerDay = quantityPerDay * (item.feedItemId.pricePerBag / item.feedItemId.quantityPerBag);
      
      const quantityForDuration = quantityPerDay * days;
      const costForDuration = costPerDay * days * feedChart.numberOfAnimals;
      
      calculations.totalQuantity += quantityForDuration;
      calculations.totalCost += costForDuration;
      
      // Store individual feed item calculations
      calculations.feedItems.push({
        feedItemId: item.feedItemId._id,
        feedItemName: item.feedItemId.name,
        quantityPerDay,
        costPerDay,
        quantityForDuration,
        costForDuration
      });
    });
    
    res.json({
      feedChart,
      calculations
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;