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
    }
});
