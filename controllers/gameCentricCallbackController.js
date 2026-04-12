const User = require("../models/model.user");
const crypto = require("crypto");

exports.gameCentricCallback = async(req, res) => {
    try {
        const { phone } = req.body;

        if (!phone) {
            return res.json({
                status: "error",
                message: "Phone number is required"
            });
        }

        let msisdn = phone;
        if (msisdn.startsWith("0")) {
            msisdn = "233" + msisdn.substring(1);
        } else if (msisdn.lenght === 10 && /^\d{10}$/.test(msisdn)) {
            msisdn = "233" + msisdn
        }

        const hashed = crypto
            .createHash("sha256")
            .update(msisdn)
            .digest("hex");

        const user = await User.findOne({ where: { msisdn_hash: hashed } });

        if (!user) {
            return res.json({
                status: "not_found",
                message: "No user found"
            });
        }

        return res.json({
            status: "active",
            message: "User found",
            phone: user.msisdn
        });

    } catch (err) {
        console.log("GameCentric Callback Error:", err);
        return res.json({
            status: "error",
            message: "Something went wrong"
        });
    }
};