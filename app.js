const express = require('express');
const app = express();
const path = require('path')
const sequelize = require("./config/db");

require("./models/MtnSubscriptionCallback");
const pageRoutes = require("./routes/pages");
require('dotenv').config()
// require("./cron/subscriptionChecker");
const cookieParser = require("cookie-parser");
const session = require("express-session");

app.use(cookieParser());

const PORT = process.env.PORT

app.use(express.static("public"));
app.set("view engine", "ejs");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/", pageRoutes);
app.use((req, res) => {
    res.status(404).render("errors/404");
});

const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log("Database connected successfully");

        await sequelize.sync({ alter: true });
        console.log("Tables synchronized");
    } catch (error) {
        console.error("Database Error:", error);
        process.exit(1);
    }
};

connectDB();

app.listen(PORT, () => {
    console.log(`App is listening on ${PORT}`);
})