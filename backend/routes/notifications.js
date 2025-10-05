const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Notification = require('../models/Notification');

// GET /api/notifications?userId=...&unread=true&type=budget_warning&page=1&limit=20
router.get('/', async (req, res) => {
  try {
    const { userId, unread, type, page = 1, limit = 20 } = req.query;
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: 'Valid userId required' });
    }
    const query = { user: userId };
    if (unread === 'true') query.read = false;
    if (type) query.type = type;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [items, total] = await Promise.all([
      Notification.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Notification.countDocuments(query)
    ]);
    res.json({
      success: true,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: items.map(n => ({
        id: n._id,
        type: n.type,
        title: n.title,
        message: n.message,
        amount: n.amount,
        budgetAmount: n.budgetAmount,
        category: n.category,
        timestamp: n.createdAt,
        read: n.read,
        priority: n.priority
      }))
    });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Server error', error: e.message });
  }
});

// GET /api/notifications/:id (debug / existence check)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid notification id' });
    }
    const notif = await Notification.findById(id);
    if (!notif) return res.status(404).json({ success: false, message: 'Notification not found' });
    res.json({
      success: true,
      data: {
        id: notif._id,
        type: notif.type,
        title: notif.title,
        message: notif.message,
        amount: notif.amount,
        budgetAmount: notif.budgetAmount,
        category: notif.category,
        timestamp: notif.createdAt,
        read: notif.read,
        priority: notif.priority
      }
    });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Server error', error: e.message });
  }
});

// Shared handler for updating read status
async function updateReadStatus(req, res) {
  try {
    const { id } = req.params;
    const { read } = req.body;
    console.log(`[NOTIFICATION_READ] method=${req.method} id=${id} body=`, req.body);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid notification id' });
    }
    if (typeof read !== 'boolean') {
      return res.status(400).json({ success: false, message: 'Body must include { "read": true|false }' });
    }

    const notif = await Notification.findByIdAndUpdate(id, { read }, { new: true });
    if (!notif) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    return res.json({
      success: true,
      data: {
        id: notif._id,
        type: notif.type,
        title: notif.title,
        message: notif.message,
        amount: notif.amount,
        budgetAmount: notif.budgetAmount,
        category: notif.category,
        timestamp: notif.createdAt,
        read: notif.read,
        priority: notif.priority
      }
    });
  } catch (e) {
    console.error('Update read status error:', e);
    return res.status(500).json({ success: false, message: 'Server error', error: e.message });
  }
}

// PATCH /api/notifications/:id/read
router.patch('/:id/read', updateReadStatus);

// PUT alias (some clients only allow PUT easily)
router.put('/:id/read', updateReadStatus);

// POST /api/notifications/mark-all-read
router.post('/mark-all-read', async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: 'Valid userId required in body' });
    }
    const result = await Notification.updateMany({ user: userId, read: false }, { $set: { read: true } });
    res.json({
      success: true,    
      modified: result.modifiedCount || result.nModified || 0
    });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Server error', error: e.message });
  }
});

// DELETE /api/notifications/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Notification.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Server error', error: e.message });
  }
});

module.exports = router;
