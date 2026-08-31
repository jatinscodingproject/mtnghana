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
        `http://98.71.49.187/Redirect` +
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
            case "111": {
                console.log("Insufficient funds status:", status);

                if (!msisdn) {
                    message = "Insufficient balance. Please recharge and try again.";
                    break;
                }

                const latestCallback = await mtnSubscriptionCallback.findOne({
                    where: {
                        msisdn: String(msisdn),
                        is_callback_received: true
                    },
                    order: [["createdAt", "DESC"]]
                });

                console.log("Latest callback for insufficient funds:", latestCallback);

                if (latestCallback) {
                    const callbackTime = new Date(latestCallback.createdAt);
                    const now = new Date();

                    const sameDay =
                        callbackTime.getFullYear() === now.getFullYear() &&
                        callbackTime.getMonth() === now.getMonth() &&
                        callbackTime.getDate() === now.getDate();

                    const differenceMinutes =
                        Math.abs(now.getTime() - callbackTime.getTime()) /
                        (1000 * 60);

                    console.log("Callback time:", callbackTime);
                    console.log("Difference:", differenceMinutes, "minutes");
                    console.log("Same day:", sameDay);

                    // Callback received today and within 10 minutes
                    if (sameDay && differenceMinutes <= 10) {
                        allowLogin = true;

                        console.log(
                            "Recent callback found. Allowing login."
                        );
                    } else {
                        allowLogin = false;

                        console.log(
                            "Callback is missing or older than 10 minutes."
                        );
                    }
                } else {
                    allowLogin = false;

                    console.log(
                        "No callback found for MSISDN:",
                        msisdn
                    );
                }

                message = "Insufficient balance. Please recharge and try again.";

                break;
            }
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
        const authHeader = req.headers.authorization;
        if (
            !authHeader ||
            !authHeader.startsWith("Bearer ")
        ) {
            return res.status(401).json({
                status: false,
                subscribed: false,
                code: "NO_TOKEN",
                message:
                    "Authentication token is required"
            });
        }
        const token = authHeader.split(" ")[1];
        let decoded;
        try {
            decoded = jwt.verify(
                token,
                process.env.JWT_SECRET
            );
        } catch (err) {
            console.log(
                "JWT validation error:",
                err.name
            );
            if (
                err.name ===
                "TokenExpiredError"
            ) {
                return res.status(401).json({
                    status: false,
                    subscribed: false,
                    code: "TOKEN_EXPIRED",
                    message:
                        "Token has expired"
                });
            }
            return res.status(401).json({
                status: false,
                subscribed: false,
                code: "INVALID_TOKEN",
                message:
                    "Invalid token"
            });
        }

        let msisdn =
            decoded.msisdn;

        if (!msisdn) {
            msisdn =
                req.query.msisdn;
        }


        if (!msisdn) {
            return res.status(400).json({
                status: false,
                subscribed: false,
                code: "NO_MSISDN",
                message:
                    "MSISDN is required"
            });
        }


        function normalizeMsisdn(value) {
            if (
                value === null ||
                value === undefined
            ) {
                return null;
            }


            let number =
                String(value).trim();

            number =
                number.replace(
                    /[\s\-().]/g,
                    ""
                );

            number =
                number.replace(
                    /^\+/,
                    ""
                );

            if (
                /^233\d{9}$/.test(number)
            ) {

                return number;
            }

            if (
                /^0\d{9}$/.test(number)
            ) {

                return (
                    "233" +
                    number.substring(1)
                );
            }

            if (
                /^\d{9}$/.test(number)
            ) {

                return (
                    "233" +
                    number
                );
            }

            return null;
        }


        const normalizedMsisdn =
            normalizeMsisdn(msisdn);


        if (!normalizedMsisdn) {

            return res.status(400).json({

                status: false,

                subscribed: false,

                code: "INVALID_MSISDN",

                message:
                    "Invalid MSISDN format"
            });
        }


        console.log(
            "Original MSISDN:",
            msisdn
        );

        console.log(
            "Normalized MSISDN:",
            normalizedMsisdn
        );

        const subscriptionEntries =
            await mtnSubscriptionCallback.findAll({

                order: [
                    ["createdAt", "DESC"]
                ]

            });


        console.log(
            "Total subscription records:",
            subscriptionEntries.length
        );


        const matchingEntries =
            subscriptionEntries.filter(
                entry => {

                    const dbMsisdn =
                        normalizeMsisdn(
                            entry.msisdn
                        );


                    return (
                        dbMsisdn ===
                        normalizedMsisdn
                    );
                }
            );


        console.log(
            "Matching subscription records:",
            matchingEntries.length
        );


        if (
            matchingEntries.length === 0
        ) {

            console.log(
                "No subscription record found:",
                normalizedMsisdn
            );


            return res.status(200).json({

                status: true,

                subscribed: false,

                code: "NO_SUBSCRIPTION",

                message:
                    "User is not subscribed",

                msisdn:
                    normalizedMsisdn
            });
        }

        const latestEntry =
            matchingEntries[0];


        console.log(
            "Latest subscription entry:",
            latestEntry
        );

        const subscriptionStatus =
            String(
                latestEntry.subscription_status ||
                ""
            )
                .trim()
                .toUpperCase();


        console.log(
            "Original DB MSISDN:",
            latestEntry.msisdn
        );

        console.log(
            "Normalized DB MSISDN:",
            normalizeMsisdn(
                latestEntry.msisdn
            )
        );

        console.log(
            "Requested MSISDN:",
            normalizedMsisdn
        );

        console.log(
            "LATEST subscription_status:",
            subscriptionStatus
        );

        console.log(
            "LATEST createdAt:",
            latestEntry.createdAt
        );


        if (
            subscriptionStatus === "D"
        ) {

            console.log(
                "USER DEACTIVATED:",
                normalizedMsisdn
            );


            return res.status(200).json({

                status: true,

                subscribed: false,

                code:
                    "SUBSCRIPTION_DEACTIVATED",

                message:
                    "User is unsubscribed",

                subscription_status:
                    "D",

                msisdn:
                    normalizedMsisdn
            });
        }



        console.log(
            "USER ACTIVE:",
            normalizedMsisdn
        );


        return res.status(200).json({

            status: true,

            subscribed: true,

            code:
                "ACTIVE_SUBSCRIPTION",

            message:
                "User has an active subscription",

            subscription_status:
                subscriptionStatus,

            msisdn:
                normalizedMsisdn
        });


    } catch (error) {

        console.error(
            "Check Subscription Error:",
            error
        );


        return res.status(500).json({

            status: false,

            subscribed: false,

            code:
                "SERVER_ERROR",

            message:
                "Unable to check subscription status",

            error:
                error.message
        });
    }

});

module.exports = router;

