const router = require('express').Router();
const passport = require('passport');
const { v4: uuidv4 } = require('uuid');
const { User } = require('../models');

const auth = passport.authenticate('jwt', { session: false });

// Get Current User
router.get('/me', auth, (req, res) => {
    res.json(req.user);
});

// Generate/Regenerate API Key
router.post('/generate-api-key', auth, async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id);
        user.api_key = uuidv4();
        await user.save();
        res.json({ api_key: user.api_key });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
