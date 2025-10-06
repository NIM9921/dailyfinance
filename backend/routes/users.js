const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const router = express.Router();

// Helper to map only required fields
function mapUserFields(u) {
  if (!u) return null;
  return {
    _id: u._id,
    name: u.name,
    email: u.email,
    telephone: u.telephone,
    image: u.image ?? null,
    avatar: u.avatar ?? null,
    isActive: u.isActive,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
    __v: u.__v,
    averageMonthlyIncome: u.averageMonthlyIncome,
    civilStatus: u.civilStatus,
    country: u.country,
    dateOfBirth: u.dateOfBirth,
    designation: u.designation,
    gender: u.gender,
    profileImage: u.profileImage || '',
    settings: u.settings || {
      currency: 'USD',
      language: 'English',
      theme: 'light',
      notifications: {
        budgetAlerts: true,
        emailNotifications: true,
        pushNotifications: false
      }
    }
  };
}

// GET /api/users/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false, message: 'Invalid user id' });

    const user = await User.findById(id).select('-password');
    if (!user)
      return res.status(404).json({ success: false, message: 'User not found' });

    return res.json({
      success: true,
      user: mapUserFields(user)
    });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Server error', error: e.message });
  }
});

// PUT /api/users/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false, message: 'Invalid user id' });

    const allowed = [
      'name','email','telephone','dateOfBirth','gender','country',
      'designation','averageMonthlyIncome','civilStatus','profileImage','avatar'
    ];
    const updates = {};
    for (const k of allowed) {
      if (req.body[k] !== undefined) updates[k] = req.body[k];
    }
    if (updates.email) updates.email = updates.email.toLowerCase();
    if (updates.dateOfBirth) updates.dateOfBirth = new Date(updates.dateOfBirth);

    const user = await User.findById(id);
    if (!user)
      return res.status(404).json({ success: false, message: 'User not found' });

    Object.assign(user, updates);
    await user.save();

    return res.json({
      success: true,
      message: 'User updated successfully',
      user: mapUserFields(user)
    });
  } catch (e) {
    if (e.code === 11000)
      return res.status(400).json({ success: false, message: 'Email already in use' });
    return res.status(500).json({ success: false, message: 'Server error', error: e.message });
  }
});

// GET /api/users/:id/settings
router.get('/:id/settings', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false, message: 'Invalid user id' });
    const user = await User.findById(id).select('settings');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    return res.json({ success: true, settings: user.settings || {} });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Server error', error: e.message });
  }
});

// PUT /api/users/:id/settings
router.put('/:id/settings', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false, message: 'Invalid user id' });

    const { currency, language, theme, notifications } = req.body;

    const user = await User.findById(id);
    if (!user)
      return res.status(404).json({ success: false, message: 'User not found' });

    if (!user.settings) user.settings = {};

    if (currency !== undefined) user.settings.currency = currency;
    if (language !== undefined) user.settings.language = language;
    if (theme !== undefined) user.settings.theme = theme;
    if (notifications && typeof notifications === 'object') {
      user.settings.notifications = {
        ...user.settings.notifications?.toObject?.() || user.settings.notifications || {},
        ...notifications
      };
    }

    await user.save();

    return res.json({
      success: true,
      message: 'Settings updated successfully',
      settings: user.settings
    });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Server error', error: e.message });
  }
});

module.exports = router;
