const express = require('express');
const app = express();
const path = require('path')
const sequelize = require("./config/db")
const pageRoutes = require("./routes/pages");
const authRoutes = require("./routes/auth");
require('dotenv').config()
// require("./cron/subscriptionChecker");
const cookieParser = require("cookie-parser");
const session = require("express-session");

app.use(session({
    name: "gameon.sid",
    secret: process.env.SESSION_SECRET || "gameon_secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: false,
        maxAge: 10 * 60 * 1000
    }
}));

app.use(cookieParser());

const PORT = process.env.PORT

app.use(express.static("public"));
app.set("view engine", "ejs");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/", [pageRoutes, authRoutes]);
app.use((req, res) => {
    res.status(404).render("errors/404");
});

const connectDB = async() => {
    try {
        await sequelize.authenticate();
        await sequelize.sync();
    } catch (error) {
        throw new Error('Connction not established', error)
    }
}
connectDB();

app.listen(PORT, () => {
    console.log(`App is listening on ${PORT}`);
})