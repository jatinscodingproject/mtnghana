const express = require("express");
const router = express.Router();
const PagesController = require("../controllers/PagesController");

router.get("/", PagesController.homePage);

module.exports = router
