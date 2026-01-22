const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const { User, RefreshToken, sequelize } = require('../models');
const { v4: uuidv4 } = require('uuid');

// Helper to generate tokens
const generateTokens = async (user) => {
    const payload = { id: user.id, name: user.name };
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '15m' });

    // Calculate simple expiry date (7 days from now)
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 7);

    const refreshToken = uuidv4();

    // Save refresh token
    // For simplicity, revoke old tokens for this user (single session)
    await RefreshToken.destroy({ where: { userId: user.id } });

    await RefreshToken.create({
        token: refreshToken,
        userId: user.id,
        expiryDate: expiryDate
    });

    return { accessToken, refreshToken };
};

// Register
router.post('/register', async (req, res) => {
    try {
        const { name, email, phoneNumber, password, confirmPassword } = req.body;

        if (password !== confirmPassword) {
            return res.status(400).json({ message: 'Passwords do not match' });
        }

        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            name,
            email,
            phoneNumber,
            password: hashedPassword,
            api_key: null // User must generate this manually
        });

        res.status(201).json({ message: 'User registered successfully', user: { id: user.id, name: user.name, email: user.email } });
    } catch (error) {
        res.status(500).json({ message: 'Error registering user', error: error.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { identifier, password } = req.body;

        const user = await User.findOne({
            where: sequelize.or(
                { email: identifier },
                { name: identifier }
            )
        });

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        if (!user.password) {
            return res.status(401).json({ message: 'Please login with Google' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate Tokens
        const { accessToken, refreshToken } = await generateTokens(user);

        res.json({ accessToken, refreshToken, user: { id: user.id, name: user.name, email: user.email, api_key: user.api_key } });
    } catch (error) {
        res.status(500).json({ message: 'Error logging in', error: error.message });
    }
});

// Refresh Token Endpoint
router.post('/refresh-token', async (req, res) => {
    const { refreshToken: requestToken } = req.body;

    if (!requestToken) {
        return res.status(400).json({ message: 'Refresh Token is required!' });
    }

    try {
        const refreshToken = await RefreshToken.findOne({ where: { token: requestToken } });

        if (!refreshToken) {
            return res.status(403).json({ message: 'Refresh token is not in database!' });
        }

        if (refreshToken.expiryDate < new Date()) {
            await RefreshToken.destroy({ where: { id: refreshToken.id } });
            return res.status(403).json({ message: 'Refresh token was expired. Please make a new signin request' });
        }

        const user = await refreshToken.getUser();
        const payload = { id: user.id, name: user.name };

        const newAccessToken = jwt.sign(payload, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '15m' });

        return res.status(200).json({
            accessToken: newAccessToken,
            refreshToken: refreshToken.token,
        });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
});

// Google Auth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: '/login', session: false }),
    async (req, res) => {
        const user = req.user;
        const { accessToken, refreshToken } = await generateTokens(user);

        // Redirect to frontend with tokens
        const frontendUrl = process.env.FRONTEND_URL;
        res.redirect(`${frontendUrl}/auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`);
    }
);

// Logout
router.post('/logout', async (req, res) => {
    try {
        const { userId } = req.body;
        if (userId) {
            await RefreshToken.destroy({ where: { userId } });
        }
        res.status(200).json({ message: 'Logged out successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
