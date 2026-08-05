const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const MtnSubscriptionCallback = sequelize.define(
    "MtnSubscriptionCallback",
    {
        id: {
            type: DataTypes.BIGINT,
            autoIncrement: true,
            primaryKey: true
        },

        transaction_id: {
            type: DataTypes.STRING(100),
            allowNull: true
        },

        cgid: {
            type: DataTypes.STRING(100),
            allowNull: true
        },

        msisdn: {
            type: DataTypes.STRING(20),
            allowNull: true
        },

        offer_id: {
            type: DataTypes.STRING(100),
            allowNull: true
        },

        command: {
            type: DataTypes.STRING(100),
            allowNull: true
        },

        subscriber_life_cycle: {
            type: DataTypes.STRING(100),
            allowNull: true
        },

        subscription_status: {
            type: DataTypes.STRING(100),
            allowNull: true
        },

        status_code: {
            type: DataTypes.STRING(20),
            allowNull: true
        },

        redirect_status: {
            type: DataTypes.STRING(20),
            allowNull: true
        },

        callback_payload: {
            type: DataTypes.JSON,
            allowNull: true
        },

        redirect_payload: {
            type: DataTypes.JSON,
            allowNull: true
        },

        is_callback_received: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        }
    },
    {
        tableName: "mtn_subscription_callbacks",
        timestamps: true,
        underscored: true
    }
);

module.exports = MtnSubscriptionCallback;