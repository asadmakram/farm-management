const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const auth = require('../middleware/auth');

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('farmName').trim().notEmpty().withMessage('Farm name is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { name, email, password, farmName, phoneNumber, address } = req.body;

      // Check if user already exists
      let user = await User.findOne({ email });
      if (user) {
        return res.status(400).json({ 
          success: false, 
          message: 'User already exists with this email' 
        });
      }

      // Create new user
      user = new User({
        name,
        email,
        password,
        farmName,
        phoneNumber,
        address
      });

      await user.save();

      // Create JWT token
      const token = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
      );

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          farmName: user.farmName,
          preferredCurrency: user.preferredCurrency
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error during registration' 
      });
    }
  }
);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { email, password } = req.body;

      // Check if user exists
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid credentials' 
        });
      }

      // Validate password
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid credentials' 
        });
      }

      // Create JWT token
      const token = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
      );

      res.json({
        success: true,
        message: 'Login successful',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          farmName: user.farmName,
          preferredCurrency: user.preferredCurrency
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error during login' 
      });
    }
  }
);

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    res.json({
      success: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        farmName: req.user.farmName,
        phoneNumber: req.user.phoneNumber,
        address: req.user.address,
        preferredCurrency: req.user.preferredCurrency,
        country: req.user.country,
        city: req.user.city,
        subscription: req.user.subscription
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// @route   PUT /api/auth/update-currency
// @desc    Update user's preferred currency
// @access  Private
router.put('/update-currency', auth, async (req, res) => {
  try {
    const { preferredCurrency } = req.body;

    if (!preferredCurrency) {
      return res.status(400).json({
        success: false,
        message: 'Preferred currency is required'
      });
    }

    // Update user
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { preferredCurrency: preferredCurrency.toUpperCase() },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Currency preference updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        farmName: user.farmName,
        phoneNumber: user.phoneNumber,
        address: user.address,
        preferredCurrency: user.preferredCurrency,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Update currency error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/auth/preferred-currency
// @desc    Update user's preferred currency (legacy route)
// @access  Private
router.put('/preferred-currency', auth, async (req, res) => {
  try {
    const { preferredCurrency } = req.body;

    if (!preferredCurrency) {
      return res.status(400).json({
        success: false,
        message: 'Preferred currency is required'
      });
    }

    // Update user
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { preferredCurrency },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Preferred currency updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        farmName: user.farmName,
        preferredCurrency: user.preferredCurrency
      }
    });
  } catch (error) {
    console.error('Update preferred currency error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/auth/settings
// @desc    Update user settings
// @access  Private
router.put('/settings', auth, async (req, res) => {
  try {
    const { preferredCurrency, country, city } = req.body;

    const updateData = {};
    if (preferredCurrency !== undefined) updateData.preferredCurrency = preferredCurrency;
    if (country !== undefined) updateData.country = country;
    if (city !== undefined) updateData.city = city;

    // Update user
    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Settings updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        farmName: user.farmName,
        phoneNumber: user.phoneNumber,
        address: user.address,
        preferredCurrency: user.preferredCurrency,
        country: user.country,
        city: user.city,
        subscription: user.subscription
      }
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
