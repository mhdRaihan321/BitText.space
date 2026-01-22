const { User, Device } = require('../models');

exports.apiAuth = async (req, res, next) => {
    const key = req.headers['x-api-key'];

    if (!key) {
        return res.status(401).json({ error: 'API key is required in x-api-key header' });
    }

    const user = await User.findOne({ where: { api_key: key } });

    if (!user) return res.status(401).json({ error: 'Invalid API key' });

    req.user = user;
    next();
};

exports.deviceAuth = async (req, res, next) => {
    const secret = req.headers['x-device-secret'];

    if (!secret) {
        return res.status(401).json({ error: 'Device secret is required' });
    }

    const device = await Device.findOne({ where: { secret } });

    if (!device) return res.status(401).json({ error: 'Invalid device' });

    req.device = device;
    next();
};
