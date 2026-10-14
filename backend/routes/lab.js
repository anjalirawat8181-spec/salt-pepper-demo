import express from 'express';

import { createHashDemo, verifyPassword } from '../utils/password.js';

const router = express.Router();

router.post('/hash-demo', (req, res) => {
  try {
    const { password } = req.body;

    if (!password || String(password).trim().length < 4) {
      return res.status(400).json({ message: 'A sample password with at least 4 characters is required.' });
    }

    const result = createHashDemo(String(password).trim());
    return res.json({
      message: 'Hashing demonstration generated successfully.',
      result,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Could not generate the demonstration.' });
  }
});

router.post('/compare-hashing', async (req, res) => {
  try {
    const { password, storedHash, storedSalt } = req.body;

    if (!password || !storedHash || !storedSalt) {
      return res.status(400).json({ message: 'Password, stored hash, and salt are required.' });
    }

    const isValid = await verifyPassword(password, storedHash, storedSalt);

    return res.json({
      match: isValid,
      algorithm: 'bcrypt-hmac-sha256-v1',
      explanation: 'The backend re-applies the pepper and stored salt before verifying the bcrypt hash.',
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Verification failed.' });
  }
});

export default router;
