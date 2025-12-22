/**
 * Simple script to process notifications.
 * Intended to be run daily (cron) or via process manager.
 * It finds notifications where alertDate <= today and isSent === false,
 * marks them as isSent = true and logs them. You can extend this to send push / email.
 */

const mongoose = require('mongoose');
require('dotenv').config();
const Notification = require('../models/Notification');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

  const today = new Date();
  today.setHours(23, 59, 59, 999);

  const dueNotifications = await Notification.find({ alertDate: { $lte: today }, isSent: false });

  console.log(`Found ${dueNotifications.length} notifications to process`);

  for (const n of dueNotifications) {
    // TODO: integrate with push/email providers here
    console.log('Processing notification:', n.title, 'for user', n.userId.toString());
    n.isSent = true;
    await n.save();
  }

  mongoose.connection.close();
}

run().catch(err => {
  console.error('Error in checkNotifications script', err);
  process.exit(1);
});
