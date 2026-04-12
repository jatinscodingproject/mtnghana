const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Invoice = sequelize.define(
    'zo_users_invoice', {
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4,
        },

        user_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },

        msisdn: {
            type: DataTypes.STRING,
            allowNull: false
        },

        invoice_number: {
            type: DataTypes.STRING,
            unique: true,
        },

        invoice_request_id: {
            type: DataTypes.STRING,
            unique: true
        },

        invoice_prefix: {
            type: DataTypes.STRING,
        },

        is_verified: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        }
    }, {
        tableName: "zo_users_invoice",
        timestamps: true,
    }
);

Invoice.associate = (models) => {
    Invoice.belongsTo(models.User, {
        foreignKey: "user_id",
        as: "user"
    });

    Invoice.hasMany(models.Subscription, {
        foreignKey: "invoice_id",
        as: "subscription"
    });
};



module.exports = Invoice;