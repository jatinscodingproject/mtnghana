const express = require("express");
const router = express.Router();
const PagesController = require("../controllers/PagesController");

router.get("/", PagesController.homePage);
router.get("/login", PagesController.loginPage);

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

        // await SubscriptionRedirect.create({
        //     cgid: CGID,
        //     transaction_id: transactionID,
        //     offer_id: Offerid,
        //     msisdn: msisdn,
        //     status_code: status,
        //     payload: req.query
        // });

        let allowLogin = false;
        let message = "";

        switch (String(status)) {
            case "200":
                allowLogin = true;
                message = "Subscription successful.";
                break;
            case "9":
            case "115":
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

            return res.redirect(
                `https://mobile.arenaxpro.com?token=${encodeURIComponent(token)}`
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

        console.log("callback body" , req.body);

        const body = req.body;

        await mtnSubscriptionCallback.create({
            transaction_id: body.transactionID,
            cgid: body.CGID,
            msisdn: body.msisdn,
            offer_id: body.offerId,
            command: body.command,
            subscriber_life_cycle: body.SubscriberLifeCycle,
            subscription_status: body.SubscriptionStatus,
            status_code: body.status,
            callback_payload: body,
            is_callback_received: true
        });

        return res.status(200).json({
            success: true
        });

    } catch (err) {
        console.error(err);

        return res.status(500).json({
            success: false
        });
    }
});

module.exports = router
