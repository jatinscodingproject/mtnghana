const Subscription = require("../models/model.subscription");
const Visit = require("../models/model.clicks")

exports.homePage = async(req, res) => {
    try {
        let ip;
        console.log("<<<<<< headers" , req.headers)
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


