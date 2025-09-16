const express = require('express');
const router = express.Router();
const { createBudget, getBudgets, deleteBudget, updateBudget } = require('../controllers/budgetController');

// POST /api/budgets - Create a new budget
router.post('/', createBudget);

// GET /api/budgets - Get all budgets
router.get('/', getBudgets);

// GET /api/budgets/:userId - Get budgets for a specific user
router.get('/:userId', getBudgets);

// DELETE /api/budgets/:budgetId - Delete a budget
router.delete('/:budgetId', deleteBudget);

// PUT /api/budgets/:budgetId - Update a budget
router.put('/:budgetId', updateBudget);

module.exports = router;
