const Category = require('../models/Category');

// @desc    Get all categories for a user
// @route   GET /api/categories
// @access  Private
const getCategories = async (req, res) => {
  try {
    let categories = await Category.find({ user: req.user.id });

    // Auto-seed default categories if user has none
    if (categories.length === 0) {
      const defaultCategories = [
        { name: 'Food', icon: '🍔', color: '#FF3366', type: 'expense' },
        { name: 'Groceries', icon: '🛒', color: '#00F0FF', type: 'expense' },
        { name: 'Home', icon: '🏠', color: '#B047FF', type: 'expense' },
        { name: 'Transport', icon: '🚗', color: '#FFB800', type: 'expense' },
        { name: 'Fuel', icon: '⛽', color: '#FF3366', type: 'expense' },
        { name: 'Bills', icon: '💡', color: '#00F0FF', type: 'expense' },
        { name: 'Shopping', icon: '🛍️', color: '#B047FF', type: 'expense' },
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
      ].map(cat => ({ ...cat, user: req.user.id }));

      categories = await Category.insertMany(defaultCategories);
    }

    res.status(200).json(categories);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Create a category
// @route   POST /api/categories
// @access  Private
const createCategory = async (req, res) => {
  try {
    const { name, color, icon, type } = req.body;

    if (!name || !type) {
      res.status(400);
      throw new Error('Name and type are required');
    }

    const category = await Category.create({
      user: req.user.id,
      name,
      color,
      icon,
      type,
    });

    res.status(201).json(category);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update a category
// @route   PUT /api/categories/:id
// @access  Private
const updateCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      res.status(404);
      throw new Error('Category not found');
    }

    // Check for user
    if (category.user.toString() !== req.user.id) {
      res.status(401);
      throw new Error('User not authorized');
    }

    const updatedCategory = await Category.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.status(200).json(updatedCategory);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete a category
// @route   DELETE /api/categories/:id
// @access  Private
const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      res.status(404);
      throw new Error('Category not found');
    }

    // Check for user
    if (category.user.toString() !== req.user.id) {
      res.status(401);
      throw new Error('User not authorized');
    }

    await category.deleteOne();

    res.status(200).json({ id: req.params.id });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
