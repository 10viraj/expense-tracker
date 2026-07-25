const Expense = require('../models/Expense');
const Income = require('../models/Income');
const Budget = require('../models/Budget');

// @desc    Get dashboard statistics
// @route   GET /api/dashboard
// @access  Private
const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get current month date range
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Total Income
    const totalIncomeAggr = await Income.aggregate([
      { $match: { user: userId } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const totalIncome = totalIncomeAggr.length > 0 ? totalIncomeAggr[0].total : 0;

    // Total Expense
    const totalExpenseAggr = await Expense.aggregate([
      { $match: { user: userId } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const totalExpense = totalExpenseAggr.length > 0 ? totalExpenseAggr[0].total : 0;

    // Total Balance
    const totalBalance = totalIncome - totalExpense;

    // Monthly Income
    const monthlyIncomeAggr = await Income.aggregate([
      { $match: { user: userId, date: { $gte: firstDay, $lte: lastDay } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const monthlyIncome = monthlyIncomeAggr.length > 0 ? monthlyIncomeAggr[0].total : 0;

    // Monthly Expense
    const monthlyExpenseAggr = await Expense.aggregate([
      { $match: { user: userId, date: { $gte: firstDay, $lte: lastDay } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const monthlyExpense = monthlyExpenseAggr.length > 0 ? monthlyExpenseAggr[0].total : 0;

    // Monthly Savings
    const monthlySavings = monthlyIncome - monthlyExpense;

    // Get Monthly Budget
    const budget = await Budget.findOne({ user: userId, month: now.getMonth() + 1, year: now.getFullYear() });
    const monthlyBudget = budget ? budget.amount : 0;
    
    // Expense Categories Chart Data (For Pie Chart)
    const expenseCategories = await Expense.aggregate([
      { $match: { user: userId } },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
      { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'categoryData' } },
      { $unwind: '$categoryData' },
      { $project: { _id: 0, name: '$categoryData.name', color: '$categoryData.color', total: 1 } },
    ]);

    // Recent Transactions
    const recentExpenses = await Expense.find({ user: userId })
      .sort({ date: -1 })
      .limit(5)
      .populate('category', 'name color icon')
      .lean();
    
    const recentIncomes = await Income.find({ user: userId })
      .sort({ date: -1 })
      .limit(5)
      .populate('category', 'name color icon')
      .lean();

    // Combine and sort recent transactions
    const allRecentTransactions = [...recentExpenses.map(e => ({...e, type: 'expense'})), ...recentIncomes.map(i => ({...i, type: 'income'}))]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);

    res.status(200).json({
      totalBalance,
      totalIncome,
      totalExpense,
      monthlySavings,
      monthlyIncome,
      monthlyExpense,
      monthlyBudget,
      expenseCategories,
      recentTransactions: allRecentTransactions,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getDashboardStats,
};
