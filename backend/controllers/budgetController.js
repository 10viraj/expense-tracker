const Budget = require('../models/Budget');

// @desc    Get budgets for a user
// @route   GET /api/budgets
// @access  Private
const getBudgets = async (req, res) => {
  try {
    const { month, year } = req.query;
    let query = { user: req.user.id };

    if (month) query.month = month;
    if (year) query.year = year;

    const budgets = await Budget.find(query).populate('category', 'name color icon');
    res.status(200).json(budgets);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Create a budget
// @route   POST /api/budgets
// @access  Private
const createBudget = async (req, res) => {
  try {
    const { month, year, amount, category } = req.body;

    if (!month || !year || !amount) {
      res.status(400);
      throw new Error('Please fill in all required fields');
    }

    const budget = await Budget.create({
      user: req.user.id,
      month,
      year,
      amount,
      category: category || null,
    });

    const populatedBudget = await Budget.findById(budget._id).populate('category', 'name color icon');
    res.status(201).json(populatedBudget);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'Budget already exists for this month and category' });
    } else {
      res.status(400).json({ message: error.message });
    }
  }
};

// @desc    Update a budget
// @route   PUT /api/budgets/:id
// @access  Private
const updateBudget = async (req, res) => {
  try {
    const budget = await Budget.findById(req.params.id);

    if (!budget) {
      res.status(404);
      throw new Error('Budget not found');
    }

    if (budget.user.toString() !== req.user.id) {
      res.status(401);
      throw new Error('User not authorized');
    }

    const updatedBudget = await Budget.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate('category', 'name color icon');

    res.status(200).json(updatedBudget);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete a budget
// @route   DELETE /api/budgets/:id
// @access  Private
const deleteBudget = async (req, res) => {
  try {
    const budget = await Budget.findById(req.params.id);

    if (!budget) {
      res.status(404);
      throw new Error('Budget not found');
    }

    if (budget.user.toString() !== req.user.id) {
      res.status(401);
      throw new Error('User not authorized');
    }

    await budget.deleteOne();

    res.status(200).json({ id: req.params.id });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getBudgets,
  createBudget,
  updateBudget,
  deleteBudget,
};
