const router = require('express').Router();
const { Sms, Device } = require('../models');
const { apiAuth } = require('../middleware/auth');
const logger = require('../utils/logger');

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

    // Sanitize deviceId
    const targetDeviceId = (deviceId && deviceId !== "null" && deviceId !== "") ? deviceId : null;

    try {
        const sms = await Sms.create({
            to,
            message: finalMessage,
            userId: req.user.id,
            deviceId: targetDeviceId
        });

        logger.info(`SMS Queued: ID ${sms.id} to ${to} (Device: ${targetDeviceId || 'Any'})`);

        // Auto Wake-Up-On-MSG Added

        // Smart Wake-up Trigger
        const { sendWakeUpPush } = require('../utils/fcm');
        if (targetDeviceId) {
            const device = await Device.findByPk(targetDeviceId);
            if (device && device.fcmToken) {
                logger.info(`Sending targeted wake-up push to device: ${targetDeviceId}`);
                sendWakeUpPush(device.fcmToken);
            } else {
                logger.info(`No FCM token found for target device: ${targetDeviceId}`);
            }
        } else {
            // Wake up ALL devices for this user if no specific device targeted
            const devices = await Device.findAll({ where: { userId: req.user.id, active: true } });
            logger.info(`Sending broadcast wake-up push to ${devices.length} devices for user ${req.user.id}`);
            for (const d of devices) {
                if (d.fcmToken) sendWakeUpPush(d.fcmToken);
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
