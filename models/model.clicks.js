const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Visit = sequelize.define(
    "Visit", {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        ip: {
            type: DataTypes.STRING(45),
            allowNull: false,
            unique: true,
        },
    }, {
        tableName: "zo_clicks",
        timestamps: true,
    }
);

module.exports = Visit;