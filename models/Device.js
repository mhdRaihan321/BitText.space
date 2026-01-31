const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

module.exports = sequelize.define('device', {
    name: DataTypes.STRING,
    secret: DataTypes.STRING,
    active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    last_seen: DataTypes.DATE,
    userId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    fcmToken: {
        type: DataTypes.TEXT, // Token can be long
        allowNull: true
    },
    status: {
        type: DataTypes.STRING, // 'ACTIVE', 'SLEEPING', 'IDLE'
        defaultValue: 'ACTIVE'
    }
});
