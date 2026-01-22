const crypto = require('crypto');

exports.generateApiKey = () => {
    return 'BitText_API_' + crypto.randomBytes(24).toString('hex');
};

exports.generateDeviceSecret = () => {
    return 'BitText_dev_' + crypto.randomBytes(32).toString('hex');
};
