const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const FeedCategory = require('../models/FeedCategory');

// Create a new feed category
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, notes } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    const feedCategory = new FeedCategory({
      userId: req.user.id,
      name,
      description,
      notes
    });

    await feedCategory.save();
    res.status(201).json(feedCategory);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'This category already exists' });
    }
    res.status(400).json({ error: error.message });
  }
});

// Get all feed categories for a user
router.get('/', auth, async (req, res) => {
  try {
    const feedCategories = await FeedCategory.find({ userId: req.user.id }).sort('name');
    res.json(feedCategories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a specific feed category by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const feedCategory = await FeedCategory.findOne({ _id: req.params.id, userId: req.user.id });
    if (!feedCategory) {
      return res.status(404).json({ error: 'Feed category not found' });
    }
    res.json(feedCategory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a feed category
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, description, notes } = req.body;

    const feedCategory = await FeedCategory.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { name, description, notes },
      { new: true, runValidators: true }
    );

    if (!feedCategory) {
      return res.status(404).json({ error: 'Feed category not found' });
    }

    res.json(feedCategory);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'This category already exists' });
    }
    res.status(400).json({ error: error.message });
  }
});

// Delete a feed category
router.delete('/:id', auth, async (req, res) => {
  try {
    const feedCategory = await FeedCategory.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!feedCategory) {
      return res.status(404).json({ error: 'Feed category not found' });
    }

    res.json({ message: 'Feed category deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
