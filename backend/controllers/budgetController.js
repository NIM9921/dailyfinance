const Budget = require('../models/Budget');
const { checkBudgetThresholds } = require('../services/notificationService'); // added

// Create a new budget
const createBudget = async (req, res) => {
    try {
        const {
            userId,
            category,
            budgetAmount,
            period,
            startDate,
            endDate,
            spentAmount
        } = req.body;

        const budget = new Budget({
            userId,
            category,
            budgetAmount,
            period,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            spentAmount: spentAmount || 0
        });

        const savedBudget = await budget.save();
        checkBudgetThresholds(savedBudget).catch(()=>{}); // added
        
        res.status(201).json({
            success: true,
            message: 'Budget created successfully',
            data: savedBudget
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error creating budget',
            error: error.message
        });
    }
};

// Get all budgets for a user
const getBudgets = async (req, res) => {
    try {
        const { userId } = req.params;
        
        const budgets = await Budget.find({ userId })
            .sort({ createdAt: -1 });

        // Transform the data to match the expected format
        const formattedBudgets = budgets.map(budget => ({
            id: budget._id,
            userId: budget.userId,
            category: budget.category,
            budgetAmount: budget.budgetAmount,
            spentAmount: budget.spentAmount,
            period: budget.period,
            startDate: budget.startDate,
            endDate: budget.endDate,
            createdAt: budget.createdAt,
            updatedAt: budget.updatedAt
        }));

        res.status(200).json({
            success: true,
            budgets: formattedBudgets
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching budgets',
            error: error.message
        });
    }
};

// Delete a budget
const deleteBudget = async (req, res) => {
    try {
        const { budgetId } = req.params;
        
        const deletedBudget = await Budget.findByIdAndDelete(budgetId);
        
        if (!deletedBudget) {
            return res.status(404).json({
                success: false,
                message: 'Budget not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Budget deleted successfully',
            data: deletedBudget
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting budget',
            error: error.message
        });
    }
};

// Update a budget
const updateBudget = async (req, res) => {
    try {
        const { budgetId } = req.params;
        const {
            userId,
            category,
            budgetAmount,
            period,
            startDate,
            endDate,
            spentAmount
        } = req.body;

        const updatedBudget = await Budget.findByIdAndUpdate(
            budgetId,
            {
                userId,
                category,
                budgetAmount,
                period,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                spentAmount: spentAmount || 0
            },
            { new: true, runValidators: true }
        );

        if (!updatedBudget) {
            return res.status(404).json({
                success: false,
                message: 'Budget not found'
            });
        }
        checkBudgetThresholds(updatedBudget).catch(()=>{}); // added
        res.status(200).json({
            success: true,
            message: 'Budget updated successfully',
            data: updatedBudget
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error updating budget',
            error: error.message
        });
    }
};

module.exports = {
    createBudget,
    getBudgets,
    deleteBudget,
    updateBudget
};
