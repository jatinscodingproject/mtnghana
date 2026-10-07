const express = require("express");
const router = express.Router();
const PagesController = require("../controllers/PagesController");
const gameCentricCallback = require("../controllers/esportsController");
const advertiserController = require("../controllers/controller.advertiserController");
const axios = require("axios");

router.get("/", PagesController.homePage);
router.get("/login", PagesController.loginPage);
router.get("/terms", PagesController.termsPage);
router.post("/esports", gameCentricCallback.gameCentricCallback);
router.get("/advertisingLanding/subscribe", advertiserController.subscribe);

router.post("/user-login", async (req, res) => {
    const { msisdn } = req.body;

    const offerCode = "9916710032";
    const redirectUrl = encodeURIComponent("http://mobile.arenaxpro.com/redirect");
    const transactionID = Date.now();

    const consentUrl =
        `https://cg.mtn.com.gh/Portal` +
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
const PublisherClick = require("../models/publisherClick");


router.get("/redirect", async (req, res) => {
    try {
        console.log("redirect ==========================================================" , req.headers);
        const {
            CGID,
            transactionID,
            Offerid,
            msisdn,
            status,
            ClientTransactionId,
            clientTransactionId,
            client_transaction_id,
            ChargeAmount,
            chargeAmount
        } = req.query;

        const clientTxnId =
            ClientTransactionId ||
            clientTransactionId ||
            client_transaction_id ||
            null;


        const charge =
            ChargeAmount ||
            chargeAmount ||
            null;


        let allowLogin = false;
        let message = "";

        switch (String(status)) {
            case "200":
                console.log("I AM HERE");
                allowLogin = true;
                message = "Subscription successful.";
                break;


            // --------------------------------------------------------
            // ALREADY SUBSCRIBED
            // --------------------------------------------------------

            case "9":

            case "115":

                allowLogin = true;

                message = "You are already subscribed.";

                break;


            // --------------------------------------------------------
            // SUBSCRIPTION PROCESSING
            // --------------------------------------------------------

            case "112":

                message =
                    "Your subscription is being processed. Please wait a few moments.";

                break;


            // --------------------------------------------------------
            // CONSENT NOT PROVIDED
            // --------------------------------------------------------

            case "11":

                message =
                    "Subscription cancelled because consent was not provided.";

                break;


            // --------------------------------------------------------
            // INVALID CONSENT
            // --------------------------------------------------------

            case "12":

                message =
                    "Invalid consent received.";
                break;
            case "13":

                message =
                    "Consent processing failed.";

                break;


            // --------------------------------------------------------
            // INSUFFICIENT FUNDS
            // --------------------------------------------------------

            case "2":

            case "26":

            case "29":

            case "55":

            case "63":

            case "111": {

                console.log(
                    "Insufficient funds status:",
                    status
                );


                if (!msisdn) {

                    message =
                        "Insufficient balance. Please recharge and try again.";

                    break;
                }


                const latestCallback =
                    await mtnSubscriptionCallback.findOne({

                        where: {
                            msisdn: String(msisdn),
                            is_callback_received: true
                        },

                        order: [
                            ["createdAt", "DESC"]
                        ]
                    });


                console.log(
                    "Latest callback for insufficient funds:",
                    latestCallback
                );


                if (latestCallback) {

                    const callbackTime =
                        new Date(latestCallback.createdAt);

                    const now = new Date();


                    const sameDay =
                        callbackTime.getFullYear() ===
                            now.getFullYear() &&

                        callbackTime.getMonth() ===
                            now.getMonth() &&

                        callbackTime.getDate() ===
                            now.getDate();


                    const differenceMinutes =
                        Math.abs(
                            now.getTime() -
                            callbackTime.getTime()
                        ) /
                        (1000 * 60);


                    console.log(
                        "Callback time:",
                        callbackTime
                    );

                    console.log(
                        "Difference:",
                        differenceMinutes,
                        "minutes"
                    );

                    console.log(
                        "Same day:",
                        sameDay
                    );


                    // Callback received today and within 10 minutes

                    if (
                        sameDay &&
                        differenceMinutes <= 10
                    ) {

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


                message =
                    "Insufficient balance. Please recharge and try again.";

                break;
            }


            // --------------------------------------------------------
            // REQUEST ALREADY EXISTS
            // --------------------------------------------------------

            case "644":

                message =
                    "A subscription request already exists. Please try again later.";

                break;


            // --------------------------------------------------------
            // SUBSCRIPTION FAILED
            // --------------------------------------------------------

            case "1":

            case "91":

            case "186":

                message =
                    "Subscription failed. Please try again.";

                break;


            // --------------------------------------------------------
            // DEFAULT
            // --------------------------------------------------------

            default:

                message =
                    "Unable to process your subscription.";

                break;
        }


        // ============================================================
        // PUBLISHER POSTBACK
        // ============================================================
        //
        // Publisher mapping:
        //
        // 1. DS / DigitalSunrise
        // 2. Col Sunrese
        // 3. ALPS
        //
        // Transaction matching:
        //
        // ClientTransactionId
        //          |
        //          v
        // publisher_clicks.transaction_id
        //
        // After matching the record:
        //
        // publisher_clicks.click_id
        //          |
        //          v
        // Publisher postback
        //
        // DS and Col Sunrese:
        //      Only send when ChargeAmount > 0
        //
        // ALPS:
        //      Send when ChargeAmount = 0
        //      Send when ChargeAmount > 0
        //
        // ============================================================

        try {

            const chargeAmountNumber =
                parseFloat(charge);


            if (clientTxnId) {

                console.log(
                    "Searching publisher_clicks using ClientTransactionId:",
                    clientTxnId
                );
                const publisherClick =
                    await PublisherClick.findOne({

                        where: {
                            transaction_id: String(clientTxnId)
                        },

                        order: [
                            ["created_at", "DESC"]
                        ]
                    });

                if (publisherClick) {
                    await mtnSubscriptionCallback.update(
                        {
                            publisher: publisherClick.publisher,
                            charge_amt: !isNaN(chargeAmountNumber)
                                ? chargeAmountNumber
                                : 0
                        },
                        {
                            where: {
                                transaction_id: String(transactionID)
                            }
                        }
                    );

                    console.log("Callback record updated:", {
                        transaction_id: transactionID,
                        publisher: publisherClick.publisher,
                        charge_amt: chargeAmountNumber
                    });
                }


                console.log(
                    "Publisher Click Found:",
                    publisherClick
                );


                if (
                    publisherClick &&
                    publisherClick.click_id
                ) {

                    const clickId =
                        publisherClick.click_id;


                    const publisher =
                        String(
                            publisherClick.publisher || ""
                        )
                        .trim()
                        .toLowerCase();


                    console.log(
                        "Publisher:",
                        publisher
                    );

                    console.log(
                        "Click ID:",
                        clickId
                    );

                    console.log(
                        "Charge Amount:",
                        chargeAmountNumber
                    );

                    if (
                        (
                            publisher === "ds"
                        ) &&
                        !isNaN(chargeAmountNumber) &&
                        chargeAmountNumber > 0
                    ) {

                        const postbackUrl =
                            `https://digitalsunrise10071896.o18.link/p` +
                            `?m=16519` +
                            `&tid=${encodeURIComponent(clickId)}`;


                        console.log(
                            "=========================================="
                        );

                        console.log(
                            "DIGITAL SUNRISE POSTBACK"
                        );

                        console.log(
                            "Postback URL:",
                            postbackUrl
                        );


                        const response =
                            await axios.get(
                                postbackUrl,
                                {
                                    timeout: 10000
                                }
                            );

                        if (response.status >= 200 && response.status < 300) {
                            await publisherClick.update({
                                pixels_fired: true,
                                is_paid: chargeAmountNumber > 0
                            });

                            console.log("PublisherClick updated:", {
                                pixels_fired: true,
                                is_paid: chargeAmountNumber > 0
                            });
                        }


                        console.log(
                            "DigitalSunrise Postback Status:",
                            response.status
                        );

                        console.log(
                            "DigitalSunrise Postback Response:",
                            response.data
                        );

                    }


                    // ====================================================
                    // COL SUNRESE
                    // ====================================================
                    //
                    // Postback:
                    //
                    // http://162.243.217.139/dlv/track.php
                    // ?ccuid=<CLICK_ID>
                    //
                    // Only send when charge amount > 0.
                    // ====================================================

                    if (
                        (
                            publisher === "col"
                        ) &&
                        !isNaN(chargeAmountNumber) &&
                        chargeAmountNumber > 0
                    ) {

                        const postbackUrl =
                            `http://162.243.217.139/dlv/track.php` +
                            `?ccuid=${encodeURIComponent(clickId)}`;


                        console.log(
                            "=========================================="
                        );

                        console.log(
                            "COL SUNRESE POSTBACK"
                        );

                        console.log(
                            "Postback URL:",
                            postbackUrl
                        );


                        const response =
                            await axios.get(
                                postbackUrl,
                                {
                                    timeout: 10000
                                }
                            );
                        
                        if (response.status >= 200 && response.status < 300) {
                            await publisherClick.update({
                                pixels_fired: true,
                                is_paid: chargeAmountNumber > 0
                            });

                            console.log("PublisherClick updated:", {
                                pixels_fired: true,
                                is_paid: chargeAmountNumber > 0
                            });
                        }

                        console.log(
                            "Col Sunrese Postback Status:",
                            response.status
                        );

                        console.log(
                            "Col Sunrese Postback Response:",
                            response.data
                        );

                    }

                    if (
                        publisher === "alps"
                    ) {

                        const postbackUrl =
                            `https://ads.alpasrame.com/api/adserver/postback` +
                            `?secureid=4nfb1eqb` +
                            `&transaction_id=${encodeURIComponent(clickId)}`;


                        console.log(
                            "=========================================="
                        );

                        console.log(
                            "ALPS POSTBACK"
                        );

                        console.log(
                            "Postback URL:",
                            postbackUrl
                        );


                        const response =
                            await axios.get(
                                postbackUrl,
                                {
                                    timeout: 10000
                                }
                            );

                        if (response.status >= 200 && response.status < 300) {
                            await publisherClick.update({
                                pixels_fired: true,
                                is_paid: chargeAmountNumber > 0
                            });

                            console.log("PublisherClick updated:", {
                                pixels_fired: true,
                                is_paid: chargeAmountNumber > 0
                            });
                        }

                        console.log(
                            "ALPS Postback Status:",
                            response.status
                        );

                        console.log(
                            "ALPS Postback Response:",
                            response.data
                        );

                    }


                } else {

                    console.log(
                        "No publisher click found for ClientTransactionId:",
                        clientTxnId
                    );
                }


            } else {

                console.log(
                    "ClientTransactionId is missing. Publisher postback skipped."
                );
            }


        } catch (publisherError) {

            console.error(
                "Publisher Postback Error:",
                publisherError
            );

        }


        // ============================================================
        // CREATE JWT AND REDIRECT USER
        // ============================================================

        if (allowLogin) {

            const token =
                jwt.sign(

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


            console.log(
                "Generated Token:",
                token
            );


            return res.redirect(

                `https://mobile.arenaxpro.com` +
                `?token=${encodeURIComponent(token)}` +
                `&msisdn=${encodeURIComponent(msisdn || "")}`

            );

        }


        // ============================================================
        // SUBSCRIPTION FAILED / LOGIN NOT ALLOWED
        // ============================================================

        return res.redirect(

            `https://mobile.arenaxpro.com` +
            `?error=${encodeURIComponent(message)}`

        );


    } catch (error) {

        console.error(
            "Redirect Error:",
            error
        );


        return res.redirect(

            `https://mobile.arenaxpro.com` +
            `?error=${encodeURIComponent(
                "Something went wrong. Please try again."
            )}`

        );

    }
});




// router.get("/redirect", async (req, res) => {
//     try {
//         const {
//             CGID,
//             transactionID,
//             Offerid,
//             msisdn,
//             status
//         } = req.query;

//         console.log(req.header);

//         console.log('query' , req.query);

//         let allowLogin = false;
//         let message = "";

//         switch (String(status)) {
//             case "200":
//                 console.log("I AM here")
//                 allowLogin = true;
//                 message = "Subscription successful.";
//                 break;
//             case "9":
//             case "115":3
//                 allowLogin = true;
//                 message = "You are already subscribed.";
//                 break;
//             case "112":
//                 message = "Your subscription is being processed. Please wait a few moments.";
//                 break;
//             case "11":
//                 message = "Subscription cancelled because consent was not provided.";
//                 break;
//             case "12":
//                 message = "Invalid consent received.";
//                 break;
//             case "13":
//                 message = "Consent processing failed.";
//                 break;
//            case "2":
//             case "26":
//             case "29":
//             case "55":
//             case "63":
//             case "111": {
//                 console.log("Insufficient funds status:", status);

//                 if (!msisdn) {
//                     message = "Insufficient balance. Please recharge and try again.";
//                     break;
//                 }

//                 const latestCallback = await mtnSubscriptionCallback.findOne({
//                     where: {
//                         msisdn: String(msisdn),
//                         is_callback_received: true
//                     },
//                     order: [["createdAt", "DESC"]]
//                 });

//                 console.log("Latest callback for insufficient funds:", latestCallback);

//                 if (latestCallback) {
//                     const callbackTime = new Date(latestCallback.createdAt);
//                     const now = new Date();

//                     const sameDay =
//                         callbackTime.getFullYear() === now.getFullYear() &&
//                         callbackTime.getMonth() === now.getMonth() &&
//                         callbackTime.getDate() === now.getDate();

//                     const differenceMinutes =
//                         Math.abs(now.getTime() - callbackTime.getTime()) /
//                         (1000 * 60);

//                     console.log("Callback time:", callbackTime);
//                     console.log("Difference:", differenceMinutes, "minutes");
//                     console.log("Same day:", sameDay);

//                     // Callback received today and within 10 minutes
//                     if (sameDay && differenceMinutes <= 10) {
//                         allowLogin = true;

//                         console.log(
//                             "Recent callback found. Allowing login."
//                         );
//                     } else {
//                         allowLogin = false;

//                         console.log(
//                             "Callback is missing or older than 10 minutes."
//                         );
//                     }
//                 } else {
//                     allowLogin = false;

//                     console.log(
//                         "No callback found for MSISDN:",
//                         msisdn
//                     );
//                 }

//                 message = "Insufficient balance. Please recharge and try again.";

//                 break;
//             }
//             case "644":
//                 message = "A subscription request already exists. Please try again later.";
//                 break;
//             case "1":
//             case "91":
//             case "186":
//                 message = "Subscription failed. Please try again.";
//                 break;

//             default:
//                 message = "Unable to process your subscription.";
//         }

//         if (allowLogin) {

//             const token = jwt.sign(
//                 {
//                     msisdn,
//                     transactionID,
//                     CGID
//                 },
//                 process.env.JWT_SECRET,
//                 {
//                     expiresIn: "15m"
//                 }
//             );
//             console.log('token' , token)
//             return res.redirect(
//                 `https://mobile.arenaxpro.com?token=${encodeURIComponent(token)}&msisdn=${encodeURIComponent(msisdn)}`
//             );
//         }
//         return res.redirect(
//             `https://mobile.arenaxpro.com?error=${encodeURIComponent(message)}`
//         );

//     } catch (error) {
//         console.error("Redirect Error:", error);
//         return res.redirect(
//             `https://mobile.arenaxpro.com?error=${encodeURIComponent("Something went wrong. Please try again.")}`
//         );
//     }
// });

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

        const chargeAmount = parseFloat(
            callbackData.ChargeAmount || 0
        );
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
            charge_amt: !isNaN(chargeAmount)
                ? chargeAmount
                : 0,
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

