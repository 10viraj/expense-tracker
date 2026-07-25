const Income = require('../models/Income');

// @desc    Get all incomes for a user with filtering, sorting, pagination
// @route   GET /api/incomes
// @access  Private
const getIncomes = async (req, res) => {
  try {
    const { category, startDate, endDate, sort, page = 1, limit = 10 } = req.query;

    let query = { user: req.user.id };

    // Filtering
    if (category) query.category = category;
    if (startDate && endDate) {
      query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    // Pagination
    const skip = (page - 1) * limit;

    // Sorting
    let sortObj = { date: -1 }; // default descending
    if (sort) {
      const sortParts = sort.split(':');
      sortObj[sortParts[0]] = sortParts[1] === 'asc' ? 1 : -1;
    }

    const incomes = await Income.find(query)
      .populate('category', 'name color icon')
      .sort(sortObj)
      .skip(Number(skip))
      .limit(Number(limit));

    const total = await Income.countDocuments(query);

    res.status(200).json({
      incomes,
      page: Number(page),
      pages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Create an income
// @route   POST /api/incomes
// @access  Private
const createIncome = async (req, res) => {
  try {
    const { source, amount, date, category, notes } = req.body;

    if (!source || !amount || !category) {
      res.status(400);
      throw new Error('Please fill in all required fields');
    }

    const income = await Income.create({
      user: req.user.id,
      source,
      amount,
      date,
      category,
      notes,
    });

    const populatedIncome = await Income.findById(income._id).populate('category', 'name color icon');

    res.status(201).json(populatedIncome);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update an income
// @route   PUT /api/incomes/:id
// @access  Private
const updateIncome = async (req, res) => {
  try {
    const income = await Income.findById(req.params.id);

    if (!income) {
      res.status(404);
      throw new Error('Income not found');
    }

    if (income.user.toString() !== req.user.id) {
      res.status(401);
      throw new Error('User not authorized');
    }

    const updatedIncome = await Income.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate('category', 'name color icon');

    res.status(200).json(updatedIncome);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete an income
// @route   DELETE /api/incomes/:id
// @access  Private
const deleteIncome = async (req, res) => {
  try {
    const income = await Income.findById(req.params.id);

    if (!income) {
      res.status(404);
      throw new Error('Income not found');
    }

    if (income.user.toString() !== req.user.id) {
      res.status(401);
      throw new Error('User not authorized');
    }

    await income.deleteOne();

    res.status(200).json({ id: req.params.id });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getIncomes,
  createIncome,
  updateIncome,
  deleteIncome,
};
