const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const Category = require('./models/Category');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');
    
    const existingCat = await Category.findOne();
    if (!existingCat) {
      console.log('No existing categories found to grab a user ID from.');
      process.exit();
    }
    
    const userId = existingCat.user;
    
    const defaultCategories = [
      { name: 'Food', icon: '🍔', color: '#FF3366', type: 'expense' },
      { name: 'Groceries', icon: '🛒', color: '#00F0FF', type: 'expense' },
      { name: 'Home', icon: '🏠', color: '#B047FF', type: 'expense' },
      { name: 'Transport', icon: '🚗', color: '#FFB800', type: 'expense' },
      { name: 'Fuel', icon: '⛽', color: '#FF3366', type: 'expense' },
      { name: 'Bills', icon: '💡', color: '#00F0FF', type: 'expense' },
      { name: 'Entertainment', icon: '🎬', color: '#FFB800', type: 'expense' },
      { name: 'Health', icon: '🏥', color: '#FF3366', type: 'expense' },
      { name: 'Travel', icon: '✈️', color: '#00F0FF', type: 'expense' },
      { name: 'Education', icon: '📚', color: '#B047FF', type: 'expense' },
      { name: 'Work', icon: '💼', color: '#FFB800', type: 'expense' },
      { name: 'EMI & Loans', icon: '💳', color: '#FF3366', type: 'expense' },
      { name: 'Subscriptions', icon: '📱', color: '#00F0FF', type: 'expense' },
      { name: 'Gifts', icon: '🎁', color: '#B047FF', type: 'expense' },
      { name: 'Pets', icon: '🐶', color: '#FFB800', type: 'expense' },
      { name: 'Personal Care', icon: '❤️', color: '#FF3366', type: 'expense' },
      { name: 'Investment', icon: '💰', color: '#00F0FF', type: 'expense' },
      { name: 'Miscellaneous', icon: '📦', color: '#8F8F9D', type: 'expense' }
    ].map(cat => ({ ...cat, user: userId }));
    
    // check if they already exist
    const count = await Category.countDocuments({ user: userId });
    if (count > 2) {
      console.log('Categories likely already seeded.');
      process.exit();
    }

    await Category.insertMany(defaultCategories);
    console.log('Successfully seeded missing categories!');
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seed();
