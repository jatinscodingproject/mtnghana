const express = require("express");
const router = express.Router();
const PagesController = require("../controllers/PagesController");
const authMiddleware = require("../middleware/middleware.authMiddleware");

router.get("/", PagesController.homePage);
router.get("/login", PagesController.loginPage);
router.get("/register", PagesController.registrationPage);
router.get("/privacy", PagesController.privacyPage)
router.get("/terms", PagesController.termsPage)
router.get("/faq", PagesController.faqPage)
router.get("/verify", PagesController.verifyPage)
router.get("/new-verify", PagesController.newVerifyPage)
router.get("/my-account", authMiddleware, PagesController.accountPage)
module.exports = router;