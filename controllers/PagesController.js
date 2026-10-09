
const clickConfirmButton = require('../Services/Services.portalAutomation')

exports.homePage = async (req, res) => {
    try {
        console.log(
            "home page========================",
            req.headers
        );

        const headers = {
            ...req.headers
        };

        let clientIp;

        if (req.headers["x-forwarded-for"]) {
            clientIp = req.headers["x-forwarded-for"]
                .split(",")[0]
                .trim();
        } else {
            clientIp =
                req.headers["x-real-ip"] ||
                req.socket.remoteAddress ||
                null;
        }

        const msisdn =
            req.headers["msisdn"] || null;

        // Fetch transaction ID from URL
        const transactionId =
            req.query.transaction_id ||
            req.query.transactionID ||
            null;

        console.log(
            "Home Page MSISDN:",
            msisdn
        );

        console.log(
            "Home Page Client IP:",
            clientIp
        );

        console.log(
            "Home Page Transaction ID:",
            transactionId
        );

        // const automationResult =
        //     await clickConfirmButton({
        //         origin:
        //             req.get("origin") || null,

        //         msisdn,

        //         client_ip:
        //             clientIp,

        //         transactionId,

        //         headers
        //     });

        // console.log(
        //     "Automation result:",
        //     automationResult
        // );

        return res.render(
            "pages/index",
            {
                title: "Home Page",
                msisdn,
                isHE: !!msisdn,
                transactionId
            }
        );

    } catch (error) {
        console.error(
            "❌ Home page error:",
            error
        );

        // Don't render pages/error if that view doesn't exist
        return res.status(500).send({
            status: false,
            message: "Something went wrong!",
            error:
                process.env.NODE_ENV === "production"
                    ? undefined
                    : error.message
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


