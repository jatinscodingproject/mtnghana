const express = require("express");
const router = express.Router();
const registerController = require("../controllers/registerController");
const { resendOtp } = require("../controllers/resendOtpController");
const { verifyOtp } = require("../controllers/verifyOtpController");
const { hubtelCallback } = require("../controllers/hubtelCallbackController");
const { loginUser } = require("../controllers/LoginController");
const { gameCentricCallback } = require("../controllers/gameCentricCallbackController");
const Session = require("../models/model.session");
const authMiddleware = require("../middleware/middleware.authMiddleware");
const Subscription = require("../models/model.subscription");
const { subscribeFromAccount } = require("../controllers/Subscriptionfailed");
const { verifyNewOtp } = require("../controllers/verifyNewInvoiceController");

router.post('/user-login', loginUser);
router.post('/gamecentric/callback', gameCentricCallback)
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);
router.post("/register", registerController.registerUser);
router.post("/hubtel/callback", hubtelCallback);
router.post("/new-invoice", authMiddleware, subscribeFromAccount);
router.post("/verify-new-invoice", authMiddleware, verifyNewOtp);
router.post("/validate-token", async(req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) return res.json({
            status: false,
            code: "NO_TOKEN",
            message: "No token provided"
        });

        const token = authHeader.split(" ")[1];

        const session = await Session.findOne({ where: { token } });

        if (new Date(session.valid_until) < new Date()) {
            await Session.destroy({ where: { token } });
            return res.json({
                status: false,
                code: "TOKEN_EXPIRED",
                message: "Session expired"
            });
        }

        return res.json({ status: true });

    } catch (err) {
        return res.json({
            status: false,
            code: "SERVER_ERROR",
            message: err.message
        });
    }
});
router.post("/validate-token-check-subscription", async(req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.json({ status: false, code: "NO_TOKEN" });
        }

        const token = authHeader.split(" ")[1];

        const session = await Session.findOne({ where: { token } });
        if (!session) {
            return res.json({ status: false, code: "INVALID_TOKEN" });
        }

        if (new Date(session.valid_until) < new Date()) {
            await Session.destroy({ where: { token } });
            return res.json({ status: false, code: "TOKEN_EXPIRED" });
        }

        const subscription = await Subscription.findOne({
            where: { user_id: session.user_id },
            order: [
                ["createdAt", "DESC"]
            ],
        });

        if (!subscription) {
            return res.json({
                status: false,
                code: "NO_SUBSCRIPTION"
            });
        }

        if (
            subscription.sub_status !== "Active" ||
            (subscription.invoice_end_date &&
                new Date(subscription.invoice_end_date) < new Date())
        ) {
            return res.json({
                status: false,
                code: "SUBSCRIPTION_EXPIRED"
            });
        }

        return res.json({ status: true });

    } catch (err) {
        return res.json({
            status: false,
            code: "SERVER_ERROR"
        });
    }
});


module.exports = router;