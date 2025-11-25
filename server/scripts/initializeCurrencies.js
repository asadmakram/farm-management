const mongoose = require('mongoose');
const Currency = require('../models/Currency');
require('dotenv').config();

const initializeCurrencies = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Get all users
    const User = require('../models/User');
    const users = await User.find({});
    console.log(`Found ${users.length} users`);

    const defaultCurrencies = [
      { code: 'INR', name: 'Indian Rupee', symbol: '₹', exchangeRate: 1, isDefault: true },
      { code: 'USD', name: 'US Dollar', symbol: '$', exchangeRate: 83.5, isDefault: false },
      { code: 'EUR', name: 'Euro', symbol: '€', exchangeRate: 90.2, isDefault: false },
      { code: 'GBP', name: 'British Pound', symbol: '£', exchangeRate: 105.8, isDefault: false },
      { code: 'PKR', name: 'Pakistani Rupee', symbol: '₨', exchangeRate: 0.3, isDefault: false }
    ];

    for (const user of users) {
      console.log(`Initializing currencies for user: ${user.farmName}`);

      for (const curr of defaultCurrencies) {
        const existing = await Currency.findOne({
          userId: user._id,
          code: curr.code
        });

        if (!existing) {
          const currency = new Currency({
            userId: user._id,
            ...curr
          });
          await currency.save();
          console.log(`  Created currency: ${curr.code} for ${user.farmName}`);
        } else {
          console.log(`  Currency ${curr.code} already exists for ${user.farmName}`);
        }
      }
    }

    console.log('Currency initialization completed successfully');
  } catch (error) {
    console.error('Error initializing currencies:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Run the script
initializeCurrencies();