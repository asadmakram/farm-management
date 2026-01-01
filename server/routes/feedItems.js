const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const FeedItem = require('../models/FeedItem');
const FeedCalculation = require('../models/FeedCalculation');

// Create a new feed item
router.post('/', auth, async (req, res) => {
  try {
    const { name, category, quantityPerBag, unit, pricePerBag, currency, description, supplier, shelfLife, storageRequirements, nutritionalInfo } = req.body;

    // Validation
    if (!name || !quantityPerBag || !pricePerBag) {
      return res.status(400).json({ error: 'Name, quantity per bag, and price per bag are required' });
    }

    if (quantityPerBag <= 0 || pricePerBag <= 0) {
      return res.status(400).json({ error: 'Quantity and price must be positive numbers' });
    }

    const feedItem = new FeedItem({
      userId: req.user.id,
      name,
      category: category && category !== '' ? category : undefined,
      quantityPerBag,
      unit: unit || 'kg',
      pricePerBag,
      currency: currency || 'USD',
      description,
      supplier,
      shelfLife,
      storageRequirements,
      nutritionalInfo
    });

    await feedItem.save();
    await feedItem.populate('category');
    res.status(201).json(feedItem);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'A feed item with this name already exists' });
    }
    res.status(400).json({ error: error.message });
  }
});

// Get all feed items for a user
router.get('/', auth, async (req, res) => {
  try {
    const { category, isActive } = req.query;
    const filter = { userId: req.user.id };

    if (category) {
      filter.category = category;
    }

    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    const feedItems = await FeedItem.find(filter).populate('category').sort('-createdAt');
    res.json(feedItems);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a specific feed item by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const feedItem = await FeedItem.findOne({ _id: req.params.id, userId: req.user.id }).populate('category');
    if (!feedItem) {
      return res.status(404).json({ error: 'Feed item not found' });
    }
    res.json(feedItem);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a feed item
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, category, quantityPerBag, unit, pricePerBag, currency, description, supplier, shelfLife, storageRequirements, nutritionalInfo, isActive } = req.body;

    // Validation
    if (quantityPerBag !== undefined && quantityPerBag <= 0) {
      return res.status(400).json({ error: 'Quantity per bag must be a positive number' });
    }

    if (pricePerBag !== undefined && pricePerBag <= 0) {
      return res.status(400).json({ error: 'Price per bag must be a positive number' });
    }

    const updateData = {
      name,
      category: category && category !== '' ? category : undefined,
      quantityPerBag,
      unit,
      pricePerBag,
      currency,
      description,
      supplier,
      shelfLife,
      storageRequirements,
      nutritionalInfo,
      isActive,
      updatedAt: Date.now()
    };

    const feedItem = await FeedItem.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      updateData,
      { new: true, runValidators: true }
    ).populate('category');

    if (!feedItem) {
      return res.status(404).json({ error: 'Feed item not found' });
    }

    res.json(feedItem);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'A feed item with this name already exists' });
    }
    res.status(400).json({ error: error.message });
  }
});

// Delete a feed item
router.delete('/:id', auth, async (req, res) => {
  try {
    const feedItem = await FeedItem.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!feedItem) {
      return res.status(404).json({ error: 'Feed item not found' });
    }

    // Delete associated calculations
    await FeedCalculation.deleteMany({ feedItemId: req.params.id });

    res.json({ message: 'Feed item deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;