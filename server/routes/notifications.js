const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');

// Get list of notifications for user (upcoming / unread first)
router.get('/', auth, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id }).sort({ alertDate: 1, createdAt: -1 });
    res.json({ notifications });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching notifications', error: error.message });
  }
});

// Mark notification as read or sent
router.put('/:id', auth, async (req, res) => {
  try {
    const notification = await Notification.findOne({ _id: req.params.id, userId: req.user.id });
    if (!notification) return res.status(404).json({ message: 'Notification not found' });

    if (req.body.isRead !== undefined) notification.isRead = !!req.body.isRead;
    if (req.body.isSent !== undefined) notification.isSent = !!req.body.isSent;

    await notification.save();
    res.json(notification);
  } catch (error) {
    res.status(400).json({ message: 'Error updating notification', error: error.message });
  }
});

module.exports = router;
