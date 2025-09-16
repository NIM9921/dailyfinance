const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    category: {
        type: String,
        required: true,
        trim: true
    },
    budgetAmount: {
        type: Number,
        required: true,
        min: 0
    },
    period: {
        type: String,
        required: true,
        enum: ['daily', 'weekly', 'monthly', 'yearly']
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    spentAmount: {
        type: Number,
        default: 0,
        min: 0
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Budget', budgetSchema);
