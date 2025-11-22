require('dotenv').config();
const mongoose = require('mongoose');
const MilkSale = require('../models/MilkSale');

async function run() {
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/farm';
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to DB');
  try {
    const sales = await MilkSale.find({});
    let updated = 0;
    for (const s of sales) {
      const qty = Number(s.quantity || 0);
      const rate = Number(s.ratePerLiter || 0);
      const expected = qty * rate;
      if (!s.totalAmount || s.totalAmount !== expected) {
        s.totalAmount = expected;
        await s.save();
        updated++;
      }
    }
    console.log(`Updated ${updated} milk sales`);
  } catch (err) {
    console.error('Error updating milk sales', err);
  } finally {
    await mongoose.disconnect();
    console.log('Done');
  }
}

run();
