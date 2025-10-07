const express = require('express');
const router = express.Router();
const { createBudget, getBudgets, deleteBudget, updateBudget } = require('../controllers/budgetController');
const mongoose = require('mongoose');
const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');

// POST /api/budgets - Create a new budget
router.post('/', createBudget);

// NEW: GET /api/budgets/summary/:userId - Budget summary (Total Budget, Total Spend, Remain)
router.get('/summary/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid userId' });
    }

    const { startDate, endDate } = req.query;
    let budgetsQuery = { userId: new mongoose.Types.ObjectId(userId) };

    // Optional date range overlap filter: budget overlaps the range
    let rangeStart = startDate ? new Date(startDate) : null;
    let rangeEnd = endDate ? new Date(endDate) : null;
    if (rangeStart && rangeEnd) {
      budgetsQuery.$and = [
        { startDate: { $lte: rangeEnd } },
        { endDate: { $gte: rangeStart } }
      ];
    } else if (rangeStart) {
      budgetsQuery.endDate = { $gte: rangeStart };
    } else if (rangeEnd) {
      budgetsQuery.startDate = { $lte: rangeEnd };
    }

    const budgets = await Budget.find(budgetsQuery).lean();

    if (!budgets.length) {
      return res.json({
        success: true,
        data: { totalBudget: 0, totalSpend: 0, remain: 0, breakdown: [] }
      });
    }

    // Collect category names from budgets
    const budgetCategoryNames = [...new Set(budgets.map(b => b.category))];

    // Fetch Category docs (assuming category in Budget is stored as name)
    const categories = await Category.find({
      user: userId,
      name: { $in: budgetCategoryNames }
    }).select('_id name').lean();

    const nameToCategoryIds = categories.reduce((acc, c) => {
      acc[c.name] = acc[c.name] || [];
      acc[c.name].push(c._id.toString());
      return acc;
    }, {});

    // Build transaction date range (limit to provided query or overall min/max of budgets)
    const overallStart = rangeStart || new Date(Math.min(...budgets.map(b => b.startDate.getTime())));
    const overallEnd = rangeEnd || new Date(Math.max(...budgets.map(b => b.endDate.getTime())));

    // All expense transactions for mapped categories within overall date window
    const allCategoryIds = [...new Set(Object.values(nameToCategoryIds).flat())];
    let transactions = [];
    if (allCategoryIds.length) {
      transactions = await Transaction.find({
        user: userId,
        type: 'expense',
        category: { $in: allCategoryIds },
        date: { $gte: overallStart, $lte: overallEnd }
      })
        .populate('category', 'name')
        .select('amount date category')
        .lean();
    }

    // Compute per-budget spend
    const breakdown = budgets.map(budget => {
      const spend = transactions
        .filter(t =>
          t.category &&
          t.category.name === budget.category &&
          t.date >= budget.startDate &&
          t.date <= budget.endDate
        )
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      const remain = budget.budgetAmount - spend;
      return {
        budgetId: budget._id,
        category: budget.category,
        period: budget.period,
        startDate: budget.startDate,
        endDate: budget.endDate,
        budgetAmount: budget.budgetAmount,
        spend: Number(spend.toFixed(2)),
        remain: Number(remain.toFixed(2))
      };
    });

    const totalBudget = breakdown.reduce((s, b) => s + b.budgetAmount, 0);
    const totalSpend = breakdown.reduce((s, b) => s + b.spend, 0);
    const remain = totalBudget - totalSpend;

    res.json({
      success: true,
      data: {
        totalBudget: Number(totalBudget.toFixed(2)),
        totalSpend: Number(totalSpend.toFixed(2)),
        remain: Number(remain.toFixed(2)),
        // Added aliases for direct frontend binding
        TotalBudget: Number(totalBudget.toFixed(2)),
        TotalSpend: Number(totalSpend.toFixed(2)),
        Remain: Number(remain.toFixed(2)),
        breakdown
      }
    });
  } catch (err) {
    console.error('Budget summary error:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// GET /api/budgets - Get all budgets
router.get('/', getBudgets);

// GET /api/budgets/:userId - Get budgets for a specific user
router.get('/:userId', getBudgets);

// DELETE /api/budgets/:budgetId - Delete a budget
router.delete('/:budgetId', deleteBudget);

// PUT /api/budgets/:budgetId - Update a budget
router.put('/:budgetId', updateBudget);

module.exports = router;
