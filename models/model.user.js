const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const { encrypt, decrypt } = require("../utils/utils.crypto");
const crypto = require("crypto");

const User = sequelize.define(
    "zo_users", {
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4,
        },
        name: {
            type: DataTypes.TEXT,
            allowNull: false,
            set(value) {
                this.setDataValue("name", encrypt(value));
            },
            get() {
                return decrypt(this.getDataValue("name"));
            },
        },
        msisdn: {
            type: DataTypes.TEXT,
            allowNull: false,
            set(value) {
                this.setDataValue("msisdn", encrypt(value));
                const hash = crypto.createHash("sha256").update(value).digest("hex");
                this.setDataValue("msisdn_hash", hash);
            },
            get() {
                return decrypt(this.getDataValue("msisdn"));
            },
        },

        msisdn_hash: {
            type: DataTypes.STRING(64),
            unique: true,
        },

        subscription_type: {
            type: DataTypes.TEXT,
            allowNull: false,
            set(value) {
                this.setDataValue("subscription_type", encrypt(value));
            },
            get() {
                return decrypt(this.getDataValue("subscription_type"));
            },
        },

        channel: {
            type: DataTypes.TEXT,
            allowNull: false,
            set(value) {
                this.setDataValue("channel", encrypt(value));
            },
            get() {
                return decrypt(this.getDataValue("channel"));
            },
        },
        isverify: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        autorenew: {
            type: DataTypes.BOOLEAN,
            allowNull: false
        }
    }, {
        tableName: "zo_users",
        timestamps: true,
    }
);

User.associate = (models) => {
    User.hasMany(models.Invoice, {
        foreignKey: "user_id",
        as: "invoices",
        onDelete: "CASCADE"
    });

    User.hasMany(models.Subscription, {
        foreignKey: "user_id",
        as: "subscriptions",
        onDelete: "CASCADE"
    });
};


module.exports = User;