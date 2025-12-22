const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recurringExpenseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RecurringExpense'
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String
  },
  dueDate: {
    type: Date,
    required: true
  },
  alertDate: {
    type: Date,
    required: true
  },
  isSent: {
    type: Boolean,
    default: false
  },
  isRead: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

notificationSchema.index({ userId: 1, alertDate: 1, isSent: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
