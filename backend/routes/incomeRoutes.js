const express = require('express');
const router = express.Router();
const {
  getIncomes,
  createIncome,
  updateIncome,
  deleteIncome,
} = require('../controllers/incomeController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/').get(protect, getIncomes).post(protect, createIncome);
router.route('/:id').put(protect, updateIncome).delete(protect, deleteIncome);

module.exports = router;
