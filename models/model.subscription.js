const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Subscription = sequelize.define(
    "zo_users_subscription", {
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4,
        },

        user_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },

        invoice_id: {
            type: DataTypes.UUID,
            allowNull: false
        },

        response_code: DataTypes.STRING,
        message: DataTypes.STRING,

        order_id: DataTypes.STRING,
        description: DataTypes.STRING,

        recurring_invoice_id: DataTypes.STRING,
        transaction_id: DataTypes.STRING,
        external_transaction_id: DataTypes.STRING,
        charges: DataTypes.FLOAT,
        amount_charged: DataTypes.FLOAT,
        amount_after_charges: DataTypes.FLOAT,
        amount: DataTypes.FLOAT,
        initial_amount: DataTypes.FLOAT,
        recurring_amount: DataTypes.FLOAT,
        sub_status: DataTypes.STRING,
        order_date: DataTypes.DATE,
        invoice_end_date: DataTypes.DATE,
        customer_mobile_number: DataTypes.STRING
    }, {
        tableName: "zo_users_subscription",
        timestamps: true,
    }
);

Subscription.associate = (models) => {
    Subscription.belongsTo(models.Invoice, {
        foreignKey: "invoice_id",
        as: "invoice",
    });

    Subscription.belongsTo(models.User, {
        foreignKey: "user_id",
        as: "user",
    });
};

module.exports = Subscription;