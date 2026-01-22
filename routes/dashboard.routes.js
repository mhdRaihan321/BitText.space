const router = require('express').Router();
const passport = require('passport');
const { User, Device, Sms } = require('../models');

// Middleware to protect dashboard routes
const auth = passport.authenticate('jwt', { session: false });

router.get('/stats', auth, async (req, res) => {
    try {
        const deviceCount = await Device.count({ where: { userId: req.user.id } });
        const smsCount = await Sms.count({ where: { userId: req.user.id } });
        // Calculate success rate, etc if needed
        res.json({ deviceCount, smsCount });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/devices', auth, async (req, res) => {
    try {
        const devices = await Device.findAll({ where: { userId: req.user.id } });
        res.json(devices);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/sms', auth, async (req, res) => {
    try {
        const sms = await Sms.findAll({
            where: { userId: req.user.id },
            order: [['createdAt', 'DESC']],
            limit: 50
        });
        res.json(sms);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/devices/:id', auth, async (req, res) => {
    console.log("ID: ", req.params.id);

    try {
        const result = await Device.destroy({
            where: {
                id: req.params.id,
                userId: req.user.id
            }
        });
        if (result === 0) {
            return res.status(404).json({ error: 'Device not found or not authorized' });
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
