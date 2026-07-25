const Expense = require('../models/Expense');

// @desc    Get all expenses for a user with filtering, sorting, pagination
// @route   GET /api/expenses
// @access  Private
const getExpenses = async (req, res) => {
  try {
    const { category, paymentMethod, startDate, endDate, sort, page = 1, limit = 10 } = req.query;

    let query = { user: req.user.id };

    // Filtering
    if (category) query.category = category;
    if (paymentMethod) query.paymentMethod = paymentMethod;
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

    const expenses = await Expense.find(query)
      .populate('category', 'name color icon')
      .sort(sortObj)
      .skip(Number(skip))
      .limit(Number(limit));

    const total = await Expense.countDocuments(query);

    res.status(200).json({
      expenses,
      page: Number(page),
      pages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Create an expense
// @route   POST /api/expenses
// @access  Private
const createExpense = async (req, res) => {
  try {
    const { title, amount, date, category, paymentMethod, notes, attachmentUrl } = req.body;

    if (!title || !amount || !category || !paymentMethod) {
      res.status(400);
      throw new Error('Please fill in all required fields');
    }

    const expense = await Expense.create({
      user: req.user.id,
      title,
      amount,
      date,
      category,
      paymentMethod,
      notes,
      attachmentUrl,
    });

    const populatedExpense = await Expense.findById(expense._id).populate('category', 'name color icon');

    res.status(201).json(populatedExpense);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update an expense
// @route   PUT /api/expenses/:id
// @access  Private
const updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      res.status(404);
      throw new Error('Expense not found');
    }

    if (expense.user.toString() !== req.user.id) {
      res.status(401);
      throw new Error('User not authorized');
    }

    const updatedExpense = await Expense.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate('category', 'name color icon');

    res.status(200).json(updatedExpense);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete an expense
// @route   DELETE /api/expenses/:id
// @access  Private
const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      res.status(404);
      throw new Error('Expense not found');
    }

    if (expense.user.toString() !== req.user.id) {
      res.status(401);
      throw new Error('User not authorized');
    }

    await expense.deleteOne();

    res.status(200).json({ id: req.params.id });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
};
