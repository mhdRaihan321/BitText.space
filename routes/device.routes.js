const router = require('express').Router();
const { Sms, Device, User } = require('../models');
const { deviceAuth, apiAuth } = require('../middleware/auth');
const { generateDeviceSecret } = require('../utils/keygen');
const { Op } = require('sequelize');

// List devices (API Key Auth)
router.get('/list', apiAuth, async (req, res) => {
    try {
        const devices = await Device.findAll({ where: { userId: req.user.id } });
        res.json(devices);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Register a new device
router.post('/register', async (req, res) => {
    const { name, api_key, device_id } = req.body;

    if (!name && !device_id) {
        return res.status(400).json({ error: 'Device name or ID is required' });
    }

    // Optional: Link to user if api_key provided
    let userId = null;
    if (api_key && api_key !== 'undefined') {
        const user = await User.findOne({ where: { api_key } });
        if (user) userId = user.id;
    }

    if (device_id) {
        // Attempt to re-link existing device
        const existingDevice = await Device.findOne({
            where: {
                id: device_id,
                userId: userId // Ensure ownership if userId is found
            }
        });

        if (existingDevice) {
            existingDevice.active = true;
            // Only update name if it's a "real" name update, not a default fallback
            if (name && name !== "Re-linked Device" && name !== "Android Device") {
                existingDevice.name = name;
            }
            await existingDevice.save();
            return res.json({
                device_id: existingDevice.id,
                device_secret: existingDevice.secret,
                name: existingDevice.name
            });
        }
    }

    const secret = generateDeviceSecret();

    const device = await Device.create({
        name: name || "New Device",
        secret,
        userId,
        active: true
    });

    res.json({
        device_id: device.id,
        device_secret: secret
    });
});

// Device polls for jobs
router.get('/jobs', deviceAuth, async (req, res) => {
    try {
        if (!req.device.active) {
            return res.status(403).json({ error: 'Device is inactive' });
        }

        const jobs = await Sms.findAll({
            where: {
                status: 'QUEUED',
                [Op.or]: [
                    { deviceId: req.device.id },
                    { deviceId: null }
                ]
            },
            limit: 5
        });

        for (const job of jobs) {
            job.status = 'SENDING';
            job.deviceId = req.device.id;
            await job.save();
        }

        res.json(jobs);
    } catch (error) {
        console.error("Error polling jobs:", error);
        res.status(500).json({ error: 'Failed to poll jobs' });
    }
});

router.post('/update', deviceAuth, async (req, res) => {
    try {
        const { active, status } = req.body;

        const device = await Device.findByPk(req.device.id);
        if (!device) return res.status(404).json({ error: 'Device not found' });

        const now = new Date();
        device.last_seen = now;

        if (active !== undefined) {
            device.active = active;
        }

        // Update status if provided (SLEEPING/ACTIVE)
        if (status) {
            device.status = status;
        } else {
            // If manual active update, assume ACTIVE
            if (active === true) device.status = 'ACTIVE';
        }

        await device.save();

        // Format for response if needed
        const formattedDateTime = now.toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            hour12: true
        });

        console.log(`Device ${device.id} status updated. Active: ${device.active}, Status: ${device.status}, Last Seen: ${formattedDateTime}`);

        res.json({
            success: true,
            active: device.active,
            status: device.status,
            last_seen_ist: formattedDateTime
        });
    } catch (error) {
        console.error("Error updating device:", error);
        res.status(500).json({ error: 'Failed to update device' });
    }
});


// Update FCM Token
router.post('/fcm-token', deviceAuth, async (req, res) => {
    try {
        const { fcm_token } = req.body;
        if (!fcm_token) return res.status(400).json({ error: 'Token required' });

        const device = await Device.findByPk(req.device.id);
        device.fcmToken = fcm_token;
        await device.save();

        res.json({ success: true });
    } catch (err) {
        console.error("FCM Token Update Error:", err);
        res.status(500).json({ error: 'Failed' });
    }
});


// Device reports result
router.post('/report', deviceAuth, async (req, res) => {
    const { sms_id, status } = req.body;

    if (!sms_id || !status) {
        return res.status(400).json({ error: 'Missing sms_id or status' });
    }

    try {
        const sms = await Sms.findByPk(sms_id);
        if (!sms) return res.status(404).json({ error: 'SMS not found' });

        sms.status = status; // SENT | FAILED
        await sms.save();

        res.json({ success: true });
    } catch (error) {
        console.error("Error reporting SMS status:", error);
        res.status(500).json({ error: 'Failed to report status' });
    }
});



// Delete Device (Auth via Secret)
router.delete('/delete', deviceAuth, async (req, res) => {
    try {
        const device = await Device.findByPk(req.device.id);
        if (!device) return res.status(404).json({ error: 'Device not found' });

        // Trigger Logout Push before deletion
        if (device.fcmToken) {
            const { sendWakeUpPush } = require('../utils/fcm');
            // Assuming we modify sendWakeUpPush or use a raw admin send here
            // But sendWakeUpPush basically sends "type: WAKE_UP". 
            // We need a specific LOGOUT type.
            // Let's assume we update sendWakeUpPush OR just do it manually here for now to be safe/fast.
            const admin = require('firebase-admin');
            try {
                await admin.messaging().send({
                    data: { type: "LOGOUT" },
                    token: device.fcmToken
                });
                console.log("Sent LOGOUT push to " + device.id);
            } catch (e) {
                console.error("Failed to send logout push", e);
            }
        }

        await device.destroy();
        res.json({ success: true, message: 'Device deleted' });
    } catch (err) {
        console.error("Device Deletion Error:", err);
        res.status(500).json({ error: 'Failed to delete device' });
    }
});

module.exports = router;
