const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

module.exports = sequelize.define('user', {
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
        validate: { isEmail: true }
    },
    phoneNumber: {
        type: DataTypes.STRING,
        allowNull: true
    },
    password: {
        type: DataTypes.STRING,
        allowNull: true
    },
    googleId: {
        type: DataTypes.STRING,
        allowNull: true
    },
    api_key: {
        type: DataTypes.STRING,
        defaultValue: DataTypes.UUIDV4
    }
});
