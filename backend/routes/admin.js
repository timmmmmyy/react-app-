const express = require('express');
const router = express.Router();
const db = require('../database');

module.exports = (authenticateToken) => {

    // Grant premium access to a user
    router.post('/grant-premium', authenticateToken, async (req, res) => {
        try {
            const { email } = req.body;

            if (!email) {
                return res.status(400).json({ success: false, error: 'Email is required' });
            }

            const success = await db.grantPremiumAccess(email);

            if (success) {
                res.json({ success: true, message: `Premium access granted to ${email}` });
            } else {
                res.status(404).json({ success: false, error: 'User not found or premium already granted' });
            }

        } catch (error) {
            console.error('Error granting premium access:', error);
            res.status(500).json({ success: false, error: 'Internal server error' });
        }
    });

    return router;
}; 