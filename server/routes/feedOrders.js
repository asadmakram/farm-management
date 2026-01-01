const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const FeedOrder = require('../models/FeedOrder');
const FeedItem = require('../models/FeedItem');

// Helper function to format phone number for WhatsApp
const formatPhoneForWhatsApp = (phone) => {
  if (!phone) return '';
  
  // Remove all non-numeric characters
  let cleaned = phone.replace(/[^0-9]/g, '');
  
  // If it starts with 0 (Pakistani format like 03001234567), replace with 92
  if (cleaned.startsWith('0')) {
    cleaned = '92' + cleaned.substring(1);
  }
  
  // If it doesn't have country code, assume Pakistan (92)
  if (cleaned.length === 10) {
    cleaned = '92' + cleaned;
  }
  
  return cleaned;
};

// Helper function to calculate feed requirements
const calculateFeedRequirements = (feedItems, numberOfAnimals, numberOfDays) => {
  let totalQuantity = 0;
  const orderDetails = [];

  feedItems.forEach(item => {
    const dailyQuantity = item.quantityPerTime * item.numberOfTimesPerDay * numberOfAnimals;
    const periodQuantity = dailyQuantity * numberOfDays;
    totalQuantity += periodQuantity;
    
    orderDetails.push({
      feedItemId: item.feedItemId,
      quantityRequired: periodQuantity,
      numberOfTimesPerDay: item.numberOfTimesPerDay
    });
  });

  return { totalQuantity, orderDetails };
};

// Create a new feed order
router.post('/', auth, async (req, res) => {
  try {
    const { feedItems, numberOfAnimals, startDate, endDate, supplierPhone, notes } = req.body;

    // Validation
    if (!feedItems || feedItems.length === 0) {
      return res.status(400).json({ error: 'At least one feed item is required' });
    }

    if (!numberOfAnimals || numberOfAnimals <= 0) {
      return res.status(400).json({ error: 'Number of animals must be greater than 0' });
    }

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start and end dates are required' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end <= start) {
      return res.status(400).json({ error: 'End date must be after start date' });
    }

    // Calculate number of days
    const numberOfDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    // Fetch feed items to get details
    const feedItemIds = feedItems.map(item => item.feedItemId);
    const fetchedFeedItems = await FeedItem.find({ _id: { $in: feedItemIds } });

    // Calculate requirements
    let totalQuantity = 0;
    let totalCost = 0;
    let totalBags = 0;
    const orderDetails = [];

    for (const item of feedItems) {
      const feedItem = fetchedFeedItems.find(f => f._id.toString() === item.feedItemId);
      
      if (!feedItem) {
        return res.status(400).json({ error: `Feed item ${item.feedItemId} not found` });
      }

      const dailyQuantity = item.quantityPerTime * item.numberOfTimesPerDay * numberOfAnimals;
      const periodQuantity = dailyQuantity * numberOfDays;
      const bagsRequired = Math.ceil(periodQuantity / feedItem.quantityPerBag);
      const itemCost = bagsRequired * feedItem.pricePerBag;

      totalQuantity += periodQuantity;
      totalBags += bagsRequired;
      totalCost += itemCost;

      orderDetails.push({
        feedItemId: feedItem._id,
        itemName: feedItem.name,
        quantityRequired: parseFloat(periodQuantity.toFixed(2)),
        bagsRequired,
        costRequired: parseFloat(itemCost.toFixed(2))
      });
    }

    const feedOrder = new FeedOrder({
      userId: req.user.id,
      feedItems,
      numberOfAnimals,
      startDate: start,
      endDate: end,
      numberOfDays,
      totalQuantityRequired: parseFloat(totalQuantity.toFixed(2)),
      bagsRequired: totalBags,
      totalCost: parseFloat(totalCost.toFixed(2)),
      orderDetails,
      supplierPhone,
      notes,
      status: 'DRAFT'
    });

    await feedOrder.save();
    await feedOrder.populate('feedItems.feedItemId');

    res.status(201).json(feedOrder);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all feed orders for a user
router.get('/', auth, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { userId: req.user.id };

    if (status) {
      filter.status = status;
    }

    const feedOrders = await FeedOrder.find(filter)
      .populate('feedItems.feedItemId')
      .sort('-createdAt');
    
    res.json(feedOrders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a specific feed order
router.get('/:id', auth, async (req, res) => {
  try {
    const feedOrder = await FeedOrder.findOne({ _id: req.params.id, userId: req.user.id })
      .populate('feedItems.feedItemId');
    
    if (!feedOrder) {
      return res.status(404).json({ error: 'Feed order not found' });
    }

    res.json(feedOrder);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send order via WhatsApp
router.post('/:id/send-whatsapp', auth, async (req, res) => {
  try {
    const feedOrder = await FeedOrder.findOne({ _id: req.params.id, userId: req.user.id })
      .populate('feedItems.feedItemId');
    
    if (!feedOrder) {
      return res.status(404).json({ error: 'Feed order not found' });
    }

    if (!feedOrder.supplierPhone) {
      return res.status(400).json({ error: 'Supplier phone number is required' });
    }

    // Generate WhatsApp message
    const startDate = new Date(feedOrder.startDate).toLocaleDateString();
    const endDate = new Date(feedOrder.endDate).toLocaleDateString();
    
    let message = `*Feed Order*\n\n`;
    message += `Period: ${startDate} to ${endDate} (${feedOrder.numberOfDays} days)\n`;
    message += `Animals: ${feedOrder.numberOfAnimals}\n\n`;
    message += `*Items Required:*\n`;
    
    feedOrder.orderDetails.forEach(detail => {
      message += `• ${detail.itemName}: ${detail.quantityRequired}kg (${detail.bagsRequired} bags) - PKR ${detail.costRequired}\n`;
    });
    
    message += `\n*Total:*\n`;
    message += `Quantity: ${feedOrder.totalQuantityRequired}kg\n`;
    message += `Bags: ${feedOrder.bagsRequired}\n`;
    message += `Cost: PKR ${feedOrder.totalCost}`;

    // Create WhatsApp link with properly formatted phone number
    const encodedMessage = encodeURIComponent(message);
    const formattedPhone = formatPhoneForWhatsApp(feedOrder.supplierPhone);
    const whatsappLink = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;

    // Update order status and log message
    feedOrder.status = 'ORDERED';
    feedOrder.whatsappMessageSent = true;
    feedOrder.whatsappMessageTime = new Date();
    await feedOrder.save();

    res.json({
      whatsappLink,
      message,
      status: 'ORDERED'
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Confirm delivery
router.post('/:id/confirm-delivery', auth, async (req, res) => {
  try {
    const { actualQuantityReceived, notes } = req.body;

    const feedOrder = await FeedOrder.findOne({ _id: req.params.id, userId: req.user.id });
    
    if (!feedOrder) {
      return res.status(404).json({ error: 'Feed order not found' });
    }

    feedOrder.status = 'DELIVERED';
    feedOrder.deliveryConfirmedAt = new Date();
    feedOrder.deliveryConfirmedBy = req.user.id;
    feedOrder.actualQuantityReceived = actualQuantityReceived || feedOrder.totalQuantityRequired;
    if (notes) feedOrder.notes = notes;
    
    await feedOrder.save();
    await feedOrder.populate('feedItems.feedItemId');

    res.json(feedOrder);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Start feeding (activate order)
router.post('/:id/start-feeding', auth, async (req, res) => {
  try {
    const feedOrder = await FeedOrder.findOne({ _id: req.params.id, userId: req.user.id });
    
    if (!feedOrder) {
      return res.status(404).json({ error: 'Feed order not found' });
    }

    if (feedOrder.status !== 'DELIVERED') {
      return res.status(400).json({ error: 'Can only start feeding after delivery is confirmed' });
    }

    feedOrder.status = 'ACTIVE';
    await feedOrder.save();
    await feedOrder.populate('feedItems.feedItemId');

    res.json(feedOrder);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update feed order
router.put('/:id', auth, async (req, res) => {
  try {
    const { feedItems, numberOfAnimals, startDate, endDate, supplierPhone, notes } = req.body;

    const feedOrder = await FeedOrder.findOne({ _id: req.params.id, userId: req.user.id });
    
    if (!feedOrder) {
      return res.status(404).json({ error: 'Feed order not found' });
    }

    if (feedOrder.status !== 'DRAFT') {
      return res.status(400).json({ error: 'Can only edit orders in DRAFT status' });
    }

    if (feedItems) {
      feedOrder.feedItems = feedItems;
    }
    if (numberOfAnimals) {
      feedOrder.numberOfAnimals = numberOfAnimals;
    }
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (end <= start) {
        return res.status(400).json({ error: 'End date must be after start date' });
      }
      feedOrder.startDate = start;
      feedOrder.endDate = end;
      feedOrder.numberOfDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    }
    if (supplierPhone) {
      feedOrder.supplierPhone = supplierPhone;
    }
    if (notes) {
      feedOrder.notes = notes;
    }

    await feedOrder.save();
    await feedOrder.populate('feedItems.feedItemId');

    res.json(feedOrder);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete feed order
router.delete('/:id', auth, async (req, res) => {
  try {
    const feedOrder = await FeedOrder.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    
    if (!feedOrder) {
      return res.status(404).json({ error: 'Feed order not found' });
    }

    res.json({ message: 'Feed order deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Complete feeding
router.post('/:id/complete', auth, async (req, res) => {
  try {
    const feedOrder = await FeedOrder.findOne({ _id: req.params.id, userId: req.user.id });
    
    if (!feedOrder) {
      return res.status(404).json({ error: 'Feed order not found' });
    }

    feedOrder.status = 'COMPLETED';
    await feedOrder.save();
    await feedOrder.populate('feedItems.feedItemId');

    res.json(feedOrder);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Record payment
router.post('/:id/record-payment', auth, async (req, res) => {
  try {
    const { amount, method, notes } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Payment amount must be greater than 0' });
    }

    const feedOrder = await FeedOrder.findOne({ _id: req.params.id, userId: req.user.id });
    
    if (!feedOrder) {
      return res.status(404).json({ error: 'Feed order not found' });
    }

    const newAmountPaid = (feedOrder.amountPaid || 0) + amount;
    const newAmountDue = Math.max(0, feedOrder.totalCost - newAmountPaid);

    feedOrder.amountPaid = parseFloat(newAmountPaid.toFixed(2));
    feedOrder.amountDue = parseFloat(newAmountDue.toFixed(2));
    feedOrder.lastPaymentDate = new Date();
    feedOrder.paymentMethod = method || feedOrder.paymentMethod;
    
    // Determine payment status
    if (newAmountPaid >= feedOrder.totalCost) {
      feedOrder.paymentStatus = 'PAID';
    } else if (newAmountPaid > 0) {
      feedOrder.paymentStatus = 'PARTIAL_PAID';
    }

    // Add to payment history
    feedOrder.paymentHistory.push({
      amount: parseFloat(amount.toFixed(2)),
      paidAt: new Date(),
      method: method || 'CASH',
      notes
    });

    await feedOrder.save();
    await feedOrder.populate('feedItems.feedItemId');

    res.json(feedOrder);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update payment status
router.post('/:id/update-payment-status', auth, async (req, res) => {
  try {
    const { paymentStatus, paymentMethod } = req.body;

    const validStatuses = ['PENDING', 'PARTIAL_PAID', 'PAID', 'CASH', 'CREDIT'];
    if (paymentStatus && !validStatuses.includes(paymentStatus)) {
      return res.status(400).json({ error: 'Invalid payment status' });
    }

    const feedOrder = await FeedOrder.findOne({ _id: req.params.id, userId: req.user.id });
    
    if (!feedOrder) {
      return res.status(404).json({ error: 'Feed order not found' });
    }

    if (paymentStatus) {
      feedOrder.paymentStatus = paymentStatus;
    }
    if (paymentMethod) {
      feedOrder.paymentMethod = paymentMethod;
    }

    await feedOrder.save();
    await feedOrder.populate('feedItems.feedItemId');

    res.json(feedOrder);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get payment history
router.get('/:id/payment-history', auth, async (req, res) => {
  try {
    const feedOrder = await FeedOrder.findOne({ _id: req.params.id, userId: req.user.id });
    
    if (!feedOrder) {
      return res.status(404).json({ error: 'Feed order not found' });
    }

    res.json({
      totalCost: feedOrder.totalCost,
      amountPaid: feedOrder.amountPaid,
      amountDue: feedOrder.amountDue,
      paymentStatus: feedOrder.paymentStatus,
      paymentMethod: feedOrder.paymentMethod,
      lastPaymentDate: feedOrder.lastPaymentDate,
      paymentHistory: feedOrder.paymentHistory
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
