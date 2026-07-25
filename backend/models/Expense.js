const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Please add a title'],
      trim: true,
      maxlength: 50,
    },
    amount: {
      type: Number,
      required: [true, 'Please add an amount'],
    },
    date: {
      type: Date,
      required: [true, 'Please add a date'],
      default: Date.now,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    paymentMethod: {
      type: String,
      required: [true, 'Please add a payment method'],
      enum: ['Cash', 'Credit Card', 'Debit Card', 'Bank Transfer', 'UPI', 'Other'],
    },
    notes: {
      type: String,
      maxlength: 500,
    },
    attachmentUrl: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Expense', expenseSchema);
