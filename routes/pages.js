const express = require("express");
const router = express.Router();
const PagesController = require("../controllers/PagesController");
const gameCentricCallback = require("../controllers/esportsController");
const axios = require("axios");

router.get("/", PagesController.homePage);
router.get("/login", PagesController.loginPage);
router.get("/terms", PagesController.termsPage);
router.post("/esports", gameCentricCallback.gameCentricCallback);

router.post("/user-login", async (req, res) => {
    const { msisdn } = req.body;

    const offerCode = "9916710032";
    const redirectUrl = encodeURIComponent("http://mobile.arenaxpro.com/redirect");
    const transactionID = Date.now();

    const consentUrl =
        `https://sitcg.mtn.com.gh/Portal` +
        `?OfferCode=${offerCode}` +
        `&mobileNumber=${msisdn}` +
        `&redirectUrl=${redirectUrl}` +
        `&transactionID=${transactionID}`;

    return res.json({
        status: true,
        redirect: consentUrl
    });
});

const jwt = require("jsonwebtoken");
const mtnSubscriptionCallback = require("../models/MtnSubscriptionCallback");

router.get("/redirect", async (req, res) => {
    try {
        const {
            CGID,
            transactionID,
            Offerid,
            msisdn,
            status
        } = req.query;

        console.log('query' , req.query);

        let allowLogin = false;
        let message = "";

        switch (String(status)) {
            case "200":
                console.log("I AM here")
                allowLogin = true;
                message = "Subscription successful.";
                break;
            case "9":
            case "115":3
                allowLogin = true;
                message = "You are already subscribed.";
                break;
            case "112":
                message = "Your subscription is being processed. Please wait a few moments.";
                break;
            case "11":
                message = "Subscription cancelled because consent was not provided.";
                break;
            case "12":
                message = "Invalid consent received.";
                break;
            case "13":
                message = "Consent processing failed.";
                break;
            case "2":
            case "26":
            case "29":
            case "55":
            case "63":
            case "111":
                message = "Insufficient balance. Please recharge and try again.";
                break;
            case "644":
                message = "A subscription request already exists. Please try again later.";
                break;
            case "1":
            case "91":
            case "186":
                message = "Subscription failed. Please try again.";
                break;

            default:
                message = "Unable to process your subscription.";
        }

        if (allowLogin) {

            const token = jwt.sign(
                {
                    msisdn,
                    transactionID,
                    CGID
                },
                process.env.JWT_SECRET,
                {
                    expiresIn: "15m"
                }
            );
            console.log('token' , token)
            return res.redirect(
                `https://mobile.arenaxpro.com?token=${encodeURIComponent(token)}&msisdn=${encodeURIComponent(msisdn)}`
            );
        }
        return res.redirect(
            `https://mobile.arenaxpro.com?error=${encodeURIComponent(message)}`
        );

    } catch (error) {
        console.error("Redirect Error:", error);
        return res.redirect(
            `https://mobile.arenaxpro.com?error=${encodeURIComponent("Something went wrong. Please try again.")}`
        );
    }
});

router.post("/notify-callback", async (req, res) => {
    try {
        console.log("callback body", JSON.stringify(req.body, null, 2));
        const body = req.body;
        const callbackData = {};
        if (Array.isArray(body.requestParam?.data)) {
            body.requestParam.data.forEach(item => {
                callbackData[item.name] = item.value;
            });
        }
        console.log(callbackData);
        await mtnSubscriptionCallback.create({
            transaction_id: callbackData.TransactionId,
            client_transaction_id: callbackData.ClientTransactionId,
            cgid: body.requestId,
            msisdn: callbackData.Msisdn,
            offer_id: callbackData.OfferCode,
            command: body.requestParam.command,
            subscriber_life_cycle: callbackData.SubscriberLifeCycle,
            subscription_status: callbackData.SubscriptionStatus,
            status_code: callbackData.Reason,
            callback_payload: body,
            is_callback_received: true
        });

        return res.status(200).json({
            success: true
        });

    } catch (err) {
        console.error(err);6
        return res.status(500).json({
            success: false,
            error: err.message
        });

    }
});

router.post("/unsubscribe", async (req, res) => {
    try {
        const { msisdn, token } = req.body;

        if (!msisdn) {
            return res.status(400).json({
                status: false,
                message: "MSISDN is required"
            });
        }

        let formattedMsisdn = String(msisdn).trim();

        if (formattedMsisdn.startsWith("0")) {
            formattedMsisdn =
                "233" + formattedMsisdn.substring(1);
        }

        if (
            formattedMsisdn.length !== 12 ||
            !/^233\d{9}$/.test(formattedMsisdn)
        ) {
            return res.status(400).json({
                status: false,
                message: "Invalid MSISDN format"
            });
        }

        const path = process.env.MTN_UNSUBSCRIBE_PATH.replace(
            "{msisdn}",
            formattedMsisdn
        );

        const url = `${process.env.MTN_BASE_URL}${path}`;

        const response = await axios.delete(url, {
            headers: {
                "x-api-key": process.env.MTN_API_KEY,
                "x-country-code": "GHA",
                "Content-Type": "application/json"
            },
            data: {
                nodeId: process.env.MTN_NODE_ID,
                subscriptionId: process.env.MTN_SUBSCRIPTION_ID,
                registrationChannel:
                    process.env.MTN_REGISTRATION_CHANNEL,
                subscriptionProviderId:
                    process.env.MTN_SUBSCRIPTION_PROVIDER_ID
            },
            timeout: 30000
        });

        console.log(
            "MTN Unsubscribe Response:",
            response.data
        );

        return res.status(200).json({
            status: true,
            message: "Unsubscription request submitted successfully",
            data: response.data
        });

    } catch (error) {

        console.error(
            "MTN Unsubscribe Error:",
            error.response?.data || error.message
        );

        return res.status(
            error.response?.status || 500
        ).json({
            status: false,
            message:
                error.response?.data?.message ||
                "Unable to unsubscribe",
            data: error.response?.data || null
        });
    }
});

router.get("/check-subscription", async (req, res) => {
    try {
        let { msisdn } = req.query;

        if (!msisdn) {
            return res.status(400).json({
                status: false,
                message: "MSISDN is required"
            });
        }

        // Normalize MSISDN
        msisdn = String(msisdn).trim();

        if (msisdn.startsWith("0")) {
            msisdn = "233" + msisdn.substring(1);
        }

        if (!/^233\d{9}$/.test(msisdn)) {
            return res.status(400).json({
                status: false,
                message: "Invalid MSISDN format"
            });
        }

        // Get ONLY the latest entry for this MSISDN
        const latestEntry = await mtnSubscriptionCallback.findOne({
            where: {
                msisdn: msisdn
            },
            order: [
                ["createdAt", "DESC"]
            ]
        });

        console.log("Latest subscription entry:", latestEntry);

        // No entry found
        if (!latestEntry) {
            return res.status(200).json({
                status: true,
                subscribed: false,
                message: "User is unsubscribed"
            });
        }

        const subscriptionStatus = String(
            latestEntry.subscription_status || ""
        )
            .trim()
            .toUpperCase();

        console.log("MSISDN:", msisdn);
        console.log("Latest subscription_status:", subscriptionStatus);

        // D = Unsubscribed
        if (subscriptionStatus === "D") {
            return res.status(200).json({
                status: true,
                subscribed: false,
                message: "User is unsubscribed",
                subscription_status: "D"
            });
        }

        // Active subscription
        return res.status(200).json({
            status: true,
            subscribed: true,
            message: "User has an active subscription",
            subscription_status: latestEntry.subscription_status
        });

    } catch (error) {
        console.error(
            "Check Subscription Error:",
            error
        );

        return res.status(500).json({
            status: false,
            message: "Unable to check subscription status",
            error: error.message
        });
    }
});

module.exports = router;

