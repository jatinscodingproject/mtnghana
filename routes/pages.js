const express = require("express");
const router = express.Router();
const PagesController = require("../controllers/PagesController");
const authMiddleware = require("../middleware/middleware.authMiddleware");

router.get("/", PagesController.homePage);
router.get("/login", PagesController.loginPage);
