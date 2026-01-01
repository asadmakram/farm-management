const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const FeedCalculation = require('../models/FeedCalculation');
const FeedItem = require('../models/FeedItem');

// Utility function to calculate quantities and costs
const calculateFeedMetrics = (feedItem, quantityPerTime, numberOfTimesPerDay, numberOfAnimals) => {
  // Calculate daily quantity
  const quantityPerDay = quantityPerTime * numberOfTimesPerDay * numberOfAnimals;

  // Calculate quantities for different periods
  const quantityPer10Days = quantityPerDay * 10;
  const quantityPer20Days = quantityPerDay * 20;
  const quantityPer30Days = quantityPerDay * 30;

  // Calculate bags required
  const bagsRequired10Days = Math.ceil(quantityPer10Days / feedItem.quantityPerBag);
  const bagsRequired20Days = Math.ceil(quantityPer20Days / feedItem.quantityPerBag);
  const bagsRequired30Days = Math.ceil(quantityPer30Days / feedItem.quantityPerBag);

  // Calculate costs
  const costPer10Days = bagsRequired10Days * feedItem.pricePerBag;
  const costPer20Days = bagsRequired20Days * feedItem.pricePerBag;
  const costPer30Days = bagsRequired30Days * feedItem.pricePerBag;

  return {
    quantityPerDay,
    quantityPer10Days,
    quantityPer20Days,
    quantityPer30Days,
    costPer10Days,
    costPer20Days,
    costPer30Days,
    bagsRequired10Days,
    bagsRequired20Days,
    bagsRequired30Days
  };
};

// Create a new feed calculation with automatic calculations
router.post('/', auth, async (req, res) => {
  try {
    const { feedItemId, quantityPerTime, numberOfTimesPerDay = 2, numberOfAnimals, feedChartId, notes } = req.body;

    // Validation
    if (!feedItemId || !quantityPerTime || !numberOfAnimals) {
      return res.status(400).json({ error: 'Feed item ID, quantity per time, and number of animals are required' });
    }

    if (quantityPerTime <= 0 || numberOfAnimals <= 0) {
      return res.status(400).json({ error: 'Quantity and number of animals must be positive numbers' });
    }

    if (numberOfTimesPerDay < 1 || numberOfTimesPerDay > 10) {
      return res.status(400).json({ error: 'Number of times per day must be between 1 and 10' });
    }

    // Check if the feed item exists
    const feedItem = await FeedItem.findOne({ _id: feedItemId, userId: req.user.id });
    if (!feedItem) {
      return res.status(404).json({ error: 'Feed item not found' });
    }

    // Calculate metrics
    const metrics = calculateFeedMetrics(feedItem, quantityPerTime, numberOfTimesPerDay, numberOfAnimals);

    const feedCalculation = new FeedCalculation({
      userId: req.user.id,
      feedItemId,
      quantityPerTime,
      numberOfTimesPerDay,
      numberOfAnimals,
      feedChartId,
      notes,
      ...metrics
    });

    await feedCalculation.save();
    await feedCalculation.populate('feedItemId');
    res.status(201).json(feedCalculation);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'A calculation for this feed item already exists' });
    }
    res.status(400).json({ error: error.message });
  }
});

// Get all feed calculations for a user
router.get('/', auth, async (req, res) => {
  try {
    const { feedChartId, isActive } = req.query;
    const filter = { userId: req.user.id };

    if (feedChartId) {
      filter.feedChartId = feedChartId;
    }

    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    const feedCalculations = await FeedCalculation.find(filter)
      .populate('feedItemId')
      .populate('feedChartId')
      .sort('-createdAt');
    res.json(feedCalculations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a specific feed calculation by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const feedCalculation = await FeedCalculation.findOne({ _id: req.params.id, userId: req.user.id })
      .populate('feedItemId')
      .populate('feedChartId');
    if (!feedCalculation) {
      return res.status(404).json({ error: 'Feed calculation not found' });
    }
    res.json(feedCalculation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a feed calculation
router.put('/:id', auth, async (req, res) => {
  try {
    const { quantityPerTime, numberOfTimesPerDay = 2, numberOfAnimals, notes, isActive } = req.body;

    // Validation
    if (quantityPerTime !== undefined && quantityPerTime <= 0) {
      return res.status(400).json({ error: 'Quantity per time must be a positive number' });
    }

    if (numberOfAnimals !== undefined && numberOfAnimals <= 0) {
      return res.status(400).json({ error: 'Number of animals must be a positive number' });
    }

    // Get the current calculation to access feedItemId
    const currentCalculation = await FeedCalculation.findOne({ _id: req.params.id, userId: req.user.id });
    if (!currentCalculation) {
      return res.status(404).json({ error: 'Feed calculation not found' });
    }

    // Get the feed item for calculations
    const feedItem = await FeedItem.findById(currentCalculation.feedItemId);

    // Calculate new metrics
    const metrics = calculateFeedMetrics(
      feedItem,
      quantityPerTime !== undefined ? quantityPerTime : currentCalculation.quantityPerTime,
      numberOfTimesPerDay || currentCalculation.numberOfTimesPerDay,
      numberOfAnimals !== undefined ? numberOfAnimals : currentCalculation.numberOfAnimals
    );

    const feedCalculation = await FeedCalculation.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      {
        quantityPerTime: quantityPerTime !== undefined ? quantityPerTime : currentCalculation.quantityPerTime,
        numberOfTimesPerDay: numberOfTimesPerDay || currentCalculation.numberOfTimesPerDay,
        numberOfAnimals: numberOfAnimals !== undefined ? numberOfAnimals : currentCalculation.numberOfAnimals,
        notes,
        isActive,
        updatedAt: Date.now(),
        ...metrics
      },
      { new: true, runValidators: true }
    ).populate('feedItemId').populate('feedChartId');

    if (!feedCalculation) {
      return res.status(404).json({ error: 'Feed calculation not found' });
    }

    res.json(feedCalculation);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete a feed calculation
router.delete('/:id', auth, async (req, res) => {
  try {
    const feedCalculation = await FeedCalculation.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!feedCalculation) {
      return res.status(404).json({ error: 'Feed calculation not found' });
    }

    res.json({ message: 'Feed calculation deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Calculate quick projections without saving
router.post('/calculate/preview', auth, async (req, res) => {
  try {
    const { feedItemId, quantityPerTime, numberOfTimesPerDay = 2, numberOfAnimals } = req.body;

    // Validation
    if (!feedItemId || !quantityPerTime || !numberOfAnimals) {
      return res.status(400).json({ error: 'Feed item ID, quantity per time, and number of animals are required' });
    }

    // Get the feed item
    const feedItem = await FeedItem.findOne({ _id: feedItemId, userId: req.user.id });
    if (!feedItem) {
      return res.status(404).json({ error: 'Feed item not found' });
    }

    // Calculate metrics
    const metrics = calculateFeedMetrics(feedItem, quantityPerTime, numberOfTimesPerDay, numberOfAnimals);

    res.json({
      feedItem: {
        id: feedItem._id,
        name: feedItem.name,
        quantityPerBag: feedItem.quantityPerBag,
        pricePerBag: feedItem.pricePerBag,
        unit: feedItem.unit
      },
      calculation: metrics
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;