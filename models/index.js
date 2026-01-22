const sequelize = require('../config/db');

const User = require('./User');
const Device = require('./Device');
const Sms = require('./Sms');
const RefreshToken = require('./RefreshToken');

User.hasMany(Sms);
User.hasMany(Device);
User.hasOne(RefreshToken); // One refresh token per user (simplification for now, or hasMany for multiple devices)
Device.hasMany(Sms);

Sms.belongsTo(User);
Sms.belongsTo(Device);
Device.belongsTo(User);
RefreshToken.belongsTo(User);

module.exports = {
    sequelize,
    User,
    Device,
    Sms,
    RefreshToken
};
