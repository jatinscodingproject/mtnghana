
const clickConfirmButton = require('../Services/Services.portalAutomation')
const axios = require("axios");

exports.homePage = async (req, res) => {
    try {
        console.log(
            "home page========================",
            req.headers
        );

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

        const transactionId =
            req.query.transaction_id ||
            req.query.transactionID ||
            null;

        console.log("Home Page MSISDN:", msisdn);
        console.log("Home Page Client IP:", clientIp);
        console.log("Home Page Transaction ID:", transactionId);

        // Send headers and transaction details to customer API
        try {
            const response = await axios.post(
                "http://46.62.253.110:3777/customer/store-customer",
                {
                    phone_number: msisdn,
                    real_ip: clientIp,
                    transaction_id: transactionId,
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

            console.log(
                "Customer API response:",
                response.data
            );
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


exports.loginPage = async(req, res) => {
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

exports.termsPage = async(req, res) => {
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


