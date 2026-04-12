const Subscription = require("../models/model.subscription");
const Visit = require("../models/model.clicks")

exports.homePage = async(req, res) => {
    try {
        let ip;

        if (req.headers["x-forwarded-for"]) {
            ip = req.headers["x-forwarded-for"].split(",")[0];
        } else {
            ip = req.socket.remoteAddress;
        }

        const existingIP = await Visit.findOne({
            where: { ip },
        });

        if (!existingIP) {
            await Visit.create({ ip });
        }

        res.render("pages/index", {
            title: "Home Page",
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
        res.status(500).render("errors/500", {
            message: "Something went wrong!",
        });
    }
};

exports.registrationPage = async(req, res) => {
    try {
        res.render("pages/register", {
            title: "Registration Page",
            error: req.query.error || null,
            old: {
                name: req.query.name || "",
                msisdn: req.query.msisdn || "",
                subscription_type: req.query.subscription_type || "",
                channel: req.query.channel || ""
            }
        });
    } catch (error) {
        res.status(500).render("errors/500", {
            message: "Something went wrong!",
        });
    }
};

exports.privacyPage = async(req, res) => {
    try {
        res.render("pages/privacy", {
            title: "Privacy And Policy Page",
        });
    } catch (error) {
        res.status(500).render("errors/500", {
            message: "Something went wrong!",
        });
    }
}

exports.termsPage = async(req, res) => {
    try {
        res.render("pages/terms", {
            title: "Terms And Condition Page",
        });
    } catch (error) {
        res.status(500).render("errors/500", {
            message: "Something went wrong!",
        });
    }
}

exports.faqPage = async(req, res) => {
    try {
        res.render("pages/faq", {
            title: "FAQ Page",
        });
    } catch (error) {
        res.status(500).render("errors/500", {
            message: "Something went wrong!",
        });
    }
}

exports.verifyPage = async(req, res) => {
    try {
        res.render("pages/verify", {
            title: "Verify Page",
        });
    } catch (error) {
        res.status(500).render("errors/500", {
            message: "Something went wrong!",
        });
    }
}

exports.accountPage = async(req, res) => {
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const offset = (page - 1) * limit;

        const { rows: subscriptions, count } =
        await Subscription.findAndCountAll({
            where: { user_id: userId },
            order: [
                ["createdAt", "DESC"]
            ],
            limit,
            offset,
        });

        const totalPages = Math.ceil(count / limit);

        res.render("pages/account", {
            title: "My Account",
            subscriptions,
            currentPage: page,
            totalPages
        });

    } catch (error) {
        res.status(500).render("errors/500", {
            message: "Something went wrong!"
        });
    }
};

exports.newVerifyPage = async(req, res) => {
    try {
        res.render("pages/newverify", {
            title: "Verify Page",
        });
    } catch (error) {
        res.status(500).render("errors/500", {
            message: "Something went wrong!",
        });
    }
}