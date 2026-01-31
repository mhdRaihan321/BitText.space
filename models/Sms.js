const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

module.exports = sequelize.define('sms', {
    to: DataTypes.STRING,
    message: DataTypes.TEXT,
    status: {
        type: DataTypes.STRING,
        defaultValue: 'QUEUED'
    }
});





