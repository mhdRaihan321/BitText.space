const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

module.exports = sequelize.define('refreshToken', {
    token: {
        type: DataTypes.STRING,
        allowNull: false
    },
    expiryDate: {
        type: DataTypes.DATE,
        allowNull: false
    }
});









