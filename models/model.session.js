const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Session = sequelize.define("Session", {
    user_id: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    token: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    valid_until: {
        type: DataTypes.DATE,
        allowNull: false
    }
}, {
    tableName: "sessions",
    timestamps: true
});

module.exports = Session;