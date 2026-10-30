
// const clickConfirmButton = require('../Services/Services.portalAutomation')
const axios = require("axios");

exports.homePage = async (req, res) => {
    try {
        const headers = { ...req.headers };

        let clientIp;

        if (headers["x-forwarded-for"]) {
            clientIp = headers["x-forwarded-for"]
                .split(",")[0]
                .trim();
        } else {
            clientIp =
                headers["x-real-ip"] ||
                req.socket.remoteAddress ||
                null;
        }

        const msisdn = headers["msisdn"] || null;

        // Get transaction ID
        const transactionId =
            req.query.transaction_id ||
            req.query.transactionID ||
            null;

        // Get click ID
        const clickId =
            req.query.click_id ||
            req.query.clickid ||
            req.query.clickId ||
            req.query.subid ||
            req.query.sub_id ||
            req.query.ext_ref ||
            null;

        console.log("Home Page MSISDN:", msisdn);
        console.log("Home Page Client IP:", clientIp);
        console.log("Home Page Transaction ID:", transactionId);
        console.log("Home Page Click ID:", clickId);

        try {
            const response = await axios.post(
                "http://46.62.253.110:3777/customer/store-customer",
                {
                    phone_number: msisdn,
                    real_ip: clientIp,
                    transaction_id: transactionId,
                    click_id: clickId,
                    subid:
                        req.query.subid ||
                        req.query.sub_id ||
                        null,
                    headers: headers,
                    origin: headers.origin || null,
                    referer: headers.referer || null,
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                    timeout: 5000,
                }
            );

            console.log("Customer API Response:", response.status);

            // Fire advertiser postback only on successful API response
            if (response.status === 200 && clickId) {

                const postbackUrl = new URL(
                    "https://url.promotrking.com/advertiser/advertiser-callback"
                );

                postbackUrl.searchParams.set("client", "BMD");
                postbackUrl.searchParams.set("service", "Arena");
                postbackUrl.searchParams.set("publisher", "Prop");
                postbackUrl.searchParams.set("m", "16519");
                postbackUrl.searchParams.set("ext_ref", clickId);

                try {
                    const postbackResponse = await axios.get(
                        postbackUrl.toString(),
                        {
                            timeout: 5000,
                        }
                    );

                    console.log(
                        "Advertiser Postback Success:",
                        postbackResponse.status,
                        "Click ID:",
                        clickId
                    );

                } catch (postbackError) {
                    console.error(
                        "Advertiser Postback Failed:",
                        clickId,
                        postbackError.response?.data ||
                        postbackError.message
                    );
                }

            } else {
                console.log(
                    "Postback skipped:",
                    !clickId ? "Click ID missing" : "Customer API unsuccessful"
                );
            }

        } catch (apiError) {
            console.error(
                "Customer API failed:",
                apiError.response?.data ||
                apiError.message
            );
        }

        return res.render("pages/index", {
            title: "Home Page",
            msisdn,
            isHE: !!msisdn,
            transactionId,
        });

    } catch (error) {
        console.error("Home page error:", error);

        return res.status(500).send({
            status: false,
            message: "Something went wrong!",
            error:
                process.env.NODE_ENV === "production"
                    ? undefined
                    : error.message,
        });
    }
};


exports.loginPage = async (req, res) => {
    try {
        res.render("pages/login", {
            title: "Login Page",
        });
    } catch (error) {
        console.error(error);

        res.status(500).render("pages/error", {
            message: "Something went wrong!",
        });
    }
};


exports.termsPage = async (req, res) => {
    try {
        res.render("pages/terms", {
            title: "Terms Page",
        });
    } catch (error) {
        console.error(error);

        res.status(500).render("pages/error", {
            message: "Something went wrong!",
        });
    }
};