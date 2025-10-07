const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    required: true,
    enum: [
      'budget_warning',
      'budget_exceeded',
      'transaction_added',
      'budget_reminder',
      'system',
      'monthly_report',
      'recurring_due',
      'large_expense'
    ]
  },
  title: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },
  category: { type: String },
  budgetId: { type: mongoose.Schema.Types.ObjectId, ref: 'Budget' },
  transactionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' },
  amount: { type: Number },
  budgetAmount: { type: Number },
  read: { type: Boolean, default: false },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
  uniqueKey: { type: String, index: true },
  meta: { type: Object, default: {} }
}, { timestamps: true });

notificationSchema.index({ user: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
module.exports = mongoose.model('Notification', notificationSchema);
