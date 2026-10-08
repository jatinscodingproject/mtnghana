
const clickConfirmButton = require('../Services/Services.portalAutomation')

exports.homePage = async (req, res) => {
    try {
        console.log("home page========================" , req.headers);
        const headers = {
            ...req.headers
        };
        let ip;

        if (req.headers["x-forwarded-for"]) {
            ip = req.headers["x-forwarded-for"].split(",")[0];
        } else {
            ip = req.socket.remoteAddress;
        }

        const msisdn = req.headers.msisdn || null;

        // Fetch transaction ID from URL
        const transactionId =
            req.query.transaction_id ||
            req.query.transactionID ||
            null;
        const automationResult =
            await clickConfirmButton({
                origin: req.get("origin") || null,

                msisdn,

                client_ip: clientIp,

                transactionId,

                headers
            });

        console.log(
            "Automation result:",
            automationResult
        );

        console.log("Home Page MSISDN:", msisdn);
        console.log("Home Page Transaction ID:", transactionId);

        res.render("pages/index", {
            title: "Home Page",
            msisdn,
            isHE: !!msisdn,
            transactionId
        });

    } catch (error) {
        console.error(error);

        res.status(500).render("pages/error", {
            message: "Something went wrong!",
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


