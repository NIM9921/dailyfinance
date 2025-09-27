const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');
const authMiddleware = require('../middleware/auth');

// @route   GET /api/transactions
// @desc    Get all transactions for logged in user
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId; // Get from auth middleware
    const { type, category, startDate, endDate, page = 1, limit = 10 } = req.query;

    // Build query
    const query = { user: userId };
    if (type) query.type = type;
    if (category) query.category = category;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const transactions = await Transaction.find(query)
      .populate('category', 'name type color icon')
      .populate('user', 'name email')
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Transaction.countDocuments(query);

    res.json({
      success: true,
      count: transactions.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: transactions
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/transactions
// @desc    Create a new transaction for logged in user
// @access  Private
router.post('/', authMiddleware, async (req, res) => {
  try {
    console.log('Received transaction data:', req.body);

    const userId = req.userId; // Get from auth middleware
    const {
      title,
      amount,
      type = 'expense',
      category,
      description,
      date,
      tags,
      paymentMethod = 'cash',
      location,
      isRecurring = false,
      recurringType,
      createdAt
    } = req.body;

    // Validate required fields
    if (!title || !amount || !category) {
      return res.status(400).json({
        success: false,
        message: 'Title, amount, and category are required'
      });
    }

    // Validate amount is positive
    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than 0'
      });
    }

    // Handle category - if it's a string (category name), find or create the category
    let categoryId = category;
    
    if (typeof category === 'string') {
      const Category = require('../models/Category');
      
      // Try to find existing category for this user
      let existingCategory = await Category.findOne({ 
        name: category, 
        user: userId, 
        type: type,
        isActive: true 
      });
      
      // If category doesn't exist, create it
      if (!existingCategory) {
        console.log(`Creating new category: ${category} for user: ${userId}`);
        existingCategory = new Category({
          name: category,
          type: type,
          color: '#007bff', // Default color
          icon: 'category', // Default icon
          user: userId,
          isActive: true     
        });
        await existingCategory.save();
        console.log('New category created:', existingCategory._id);
      }
      
      categoryId = existingCategory._id;
    } else {
      // If category is an ObjectId, validate it
      if (!mongoose.Types.ObjectId.isValid(category)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid category ID format'
        });
      }
    }

    // Create transaction
    const transaction = new Transaction({
      title,
      amount: parseFloat(amount),
      type,
      category: categoryId,
      description: description || '',
      date: date ? new Date(date) : new Date(),
      user: userId, // Automatically use authenticated user ID
      tags: tags || [],
      paymentMethod,
      location: location || '',
      isRecurring,
      recurringType: isRecurring ? recurringType : undefined
    });

    await transaction.save();

    // Populate the transaction before sending response
    await transaction.populate('category', 'name type color icon');
    await transaction.populate('user', 'name email');

    res.status(201).json({
      success: true,
      message: `${type.charAt(0).toUpperCase() + type.slice(1)} transaction created successfully`,
      data: {
        ...transaction.toObject(),
        userId: userId // Include userId in response for confirmation
      }
    });
  } catch (error) {
    console.error('Create transaction error:', error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors
      });
    }

    // Handle duplicate category error
    if (error.code === 11000 && error.keyPattern && error.keyPattern.name) {
      return res.status(400).json({
        success: false,
        message: 'Category creation failed due to duplicate name'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/transactions/stats
// @desc    Get transaction statistics for logged in user
// @access  Private
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId; // Get from auth middleware
    const { startDate, endDate } = req.query;

    // Build date query
    const dateQuery = {};
    if (startDate || endDate) {
      dateQuery.date = {};
      if (startDate) dateQuery.date.$gte = new Date(startDate);
      if (endDate) dateQuery.date.$lte = new Date(endDate);
    }

    // Get income and expense totals
    const stats = await Transaction.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId), ...dateQuery } },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Format response
    const result = {
      income: { total: 0, count: 0 },
      expense: { total: 0, count: 0 },
      balance: 0
    };

    stats.forEach(stat => {
      result[stat._id] = {
        total: stat.total,
        count: stat.count
      };
    });

    result.balance = result.income.total - result.expense.total;

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   PUT /api/transactions/:id
// @desc    Update a transaction
// @access  Private
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    delete updateData.userId; // Don't allow changing user

    const transaction = await Transaction.findOneAndUpdate(
      { _id: id, user: req.userId },
      updateData,
      { new: true, runValidators: true }
    )
      .populate('category', 'name type color icon')
      .populate('user', 'name email');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    res.json({
      success: true,
      message: 'Transaction updated successfully',
      data: transaction
    });
  } catch (error) {
    console.error('Update transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   DELETE /api/transactions/:id
// @desc    Delete a transaction
// @access  Private
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const transaction = await Transaction.findOneAndDelete({ _id: id, user: req.userId });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    res.json({
      success: true,
      message: 'Transaction deleted successfully'
    });
  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/transactions/test
// @desc    Create a new transaction without authentication (for testing)
// @access  Public
router.post('/test', async (req, res) => {
  try {
    const {
      title,
      amount,
      type = 'expense',
      category,
      description,
      date,
      userId,
      tags,
      paymentMethod = 'cash',
      location,
      isRecurring = false,
      recurringType
    } = req.body;

    // Validate required fields
    if (!title || !amount || !category || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Title, amount, category, and userId are required'
      });
    }

    // Validate amount is positive
    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than 0'
      });
    }

    // If category is a string, try to find or create it
    let categoryId = category;
    if (typeof category === 'string') {
      const Category = require('../models/Category');
      let existingCategory = await Category.findOne({ name: category, user: userId });
      
      if (!existingCategory) {
        existingCategory = new Category({
          name: category,
          type: type,
          color: '#007bff',
          icon: 'category',
          user: userId
        });
        await existingCategory.save();
      }
      categoryId = existingCategory._id;
    }

    const transaction = new Transaction({
      title,
      amount: parseFloat(amount),
      type,
      category: categoryId,
      description: description || '',
      date: date ? new Date(date) : new Date(),
      user: userId,
      tags: tags || [],
      paymentMethod,
      location: location || '',
      isRecurring,
      recurringType: isRecurring ? recurringType : undefined
    });

    await transaction.save();

    // Populate the transaction before sending response
    await transaction.populate('category', 'name type color icon');
    await transaction.populate('user', 'name email');

    res.status(201).json({
      success: true,
      message: `${type.charAt(0).toUpperCase() + type.slice(1)} transaction created successfully`,
      data: transaction
    });
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/transactions/test/user/:userId
// @desc    Get all transactions for a specific user (for testing via Postman)
// @access  Public
router.get('/test/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid userId format'
      });
    }

    const { type, category, startDate, endDate, page = 1, limit = 10 } = req.query;

    const query = { user: new mongoose.Types.ObjectId(userId) };
    if (type) query.type = type;
    if (category) {
      if (!mongoose.Types.ObjectId.isValid(category)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid category ID format'
        });
      }
      query.category = new mongoose.Types.ObjectId(category);
    }
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .populate('category', 'name type color icon')
        .populate('user', 'name email')
        .sort({ date: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Transaction.countDocuments(query)
    ]);

    res.json({
      success: true,
      count: transactions.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: transactions
    });
  } catch (error) {
    console.error('Get transactions by user (test) error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;