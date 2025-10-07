const Notification = require('../models/Notification');
const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');

const THRESHOLDS = {
  warning: 95,          // percent
  exceeded: 100,
  largeExpenseFactor: 0.5 // >=50% of remaining budget -> large_expense
};

async function createIfNotExists(data) {
  if (!data.uniqueKey) return Notification.create(data);
  const exists = await Notification.findOne({ user: data.user, uniqueKey: data.uniqueKey });
  if (exists) return exists;
  return Notification.create(data);
}

function priorityFromPercent(pct) {
  if (pct >= 120) return 'high';
  if (pct >= 100) return 'high';
  if (pct >= 95) return 'medium';
  return 'low';
}

async function checkBudgetThresholds(budget) {
  if (!budget || !budget.budgetAmount) return;
  const percent = (budget.spentAmount / budget.budgetAmount) * 100;
  // Exceeded
  if (percent >= THRESHOLDS.exceeded) {
    await createIfNotExists({
      user: budget.userId,
      type: 'budget_exceeded',
      title: `Budget Exceeded: ${budget.category}`,
      message: `You have exceeded the ${budget.category} budget by ${(budget.spentAmount - budget.budgetAmount).toFixed(2)}.`,
      category: budget.category,
      budgetId: budget._id,
      amount: budget.spentAmount,
      budgetAmount: budget.budgetAmount,
      priority: 'high',
      uniqueKey: `${budget._id}:budget_exceeded`
    });
    return;
  }
  // Warning
  if (percent >= THRESHOLDS.warning) {
    await createIfNotExists({
      user: budget.userId,
      type: 'budget_warning',
      title: `Budget Alert: ${budget.category}`,
      message: `You have used ${percent.toFixed(1)}% of your ${budget.category} budget.`,
      category: budget.category,
      budgetId: budget._id,
      amount: budget.spentAmount,
      budgetAmount: budget.budgetAmount,
      priority: priorityFromPercent(percent),
      uniqueKey: `${budget._id}:budget_warning`
    });
  }
}

async function handleTransactionNotifications(transaction) {
  if (!transaction) return;
  const categoryName = transaction.category?.name;
  // Base transaction notification
  await Notification.create({
    user: transaction.user,
    type: 'transaction_added',
    title: transaction.type === 'income' ? 'New Income Added' : 'New Expense Added',
    message: `${transaction.title} of ${transaction.amount} recorded.`,
    amount: transaction.amount,
    category: categoryName,
    transactionId: transaction._id,
    priority: transaction.type === 'income' ? 'low' : 'medium'
  });

  if (transaction.type !== 'expense') return;

  // Find active budgets covering this transaction date
  const budgets = await Budget.find({
    userId: transaction.user,
    category: categoryName,
    startDate: { $lte: transaction.date },
    endDate: { $gte: transaction.date }
  });

  for (const budget of budgets) {
    // Increment spentAmount (atomic-ish)
    budget.spentAmount = (budget.spentAmount || 0) + transaction.amount;
    await budget.save();
    await checkBudgetThresholds(budget);

    // Large expense relative to remaining portion
    const remaining = budget.budgetAmount - budget.spentAmount;
    const prevRemaining = remaining + transaction.amount;
    if (prevRemaining > 0) {
      const portion = transaction.amount / prevRemaining;
      if (portion >= THRESHOLDS.largeExpenseFactor) {
        await createIfNotExists({
          user: budget.userId,
            type: 'large_expense',
            title: `Large Expense: ${categoryName}`,
            message: `Expense ${transaction.title} consumed ${(portion * 100).toFixed(1)}% of remaining ${categoryName} budget.`,
            category: categoryName,
            budgetId: budget._id,
            transactionId: transaction._id,
            amount: transaction.amount,
            budgetAmount: budget.budgetAmount,
            priority: 'high',
            uniqueKey: `${budget._id}:large_expense:${transaction._id}`
        });
      }
    }
  }
}

module.exports = {
  handleTransactionNotifications,
  checkBudgetThresholds
};
