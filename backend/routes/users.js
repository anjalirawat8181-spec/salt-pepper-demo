import express from 'express';

import authMiddleware from '../middleware/authMiddleware.js';
import User from '../models/User.js';

const router = express.Router();

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).lean();

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    return res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to load user profile.' });
  }
});

router.patch('/me', authMiddleware, async (req, res) => {
  try {
    const { name } = req.body;

    const updates = {};
    if (name && String(name).trim()) {
      updates.name = String(name).trim();
    }

    const updatedUser = await User.findByIdAndUpdate(req.user.id, updates, { new: true }).lean();

    return res.json({
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to update profile.' });
  }
});

export default router;
