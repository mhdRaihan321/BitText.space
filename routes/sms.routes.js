const router = require('express').Router();
const { Sms, Device } = require('../models');
const { apiAuth } = require('../middleware/auth');

router.post('/send', apiAuth, async (req, res) => {
    const { to, messagetype, message, deviceId } = req.body;

    console.log(to, messagetype, message, deviceId);
    let finalMessage = message || 'Test MSG!';

    if (!to || !messagetype) {
        return res.status(400).json({ error: 'Missing fields' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000);
    console.log(otp);

    if (messagetype === 'OTP') {
        finalMessage = `<#> Your OTP is ${otp}`;
    }

    try {
        const sms = await Sms.create({
            to,
            message: finalMessage,
            userId: req.user.id,
            deviceId: deviceId || null
        });

        // Auto Wake-Up-On-MSG Added

        // Smart Wake-up Trigger
        // We find the device (if assigned) and send a push.
        if (deviceId) {
            const device = await Device.findByPk(deviceId);
            if (device && device.fcmToken) {
                const { sendWakeUpPush } = require('../utils/fcm');
                sendWakeUpPush(device.fcmToken);
            }
        }

        res.json({
            success: true,
            sms_id: sms.id,
            message: finalMessage,
            status: sms.status
        });
    } catch (error) {
        console.error("Error creating SMS:", error);
        res.status(500).json({ error: 'Failed to create SMS' });
    }
});



router.get('/recipients', apiAuth, async (req, res) => {
    try {
        const recipients = await Sms.findAll({
            where: { userId: req.user.id },
            attributes: ['to'],
            group: 'to',
            raw: true
        });

        res.json(recipients);
    } catch (error) {
        console.error("Error fetching recipients:", error);
        res.status(500).json({ error: 'Failed to fetch recipients' });
    }
})
router.get('/status/:id', apiAuth, async (req, res) => {
    const sms = await Sms.findByPk(req.params.id);

    if (!sms) return res.status(404).json({ error: 'Not found' });

    res.json({ status: sms.status });
});

router.get('/history', apiAuth, async (req, res) => {
    try {
        const sms = await Sms.findAll({
            where: { userId: req.user.id },
            order: [['createdAt', 'DESC']],
            limit: 50
        });
        res.json(sms);
    } catch (error) {
        console.error("Error fetching history:", error);
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});

module.exports = router;
