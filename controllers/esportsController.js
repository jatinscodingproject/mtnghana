const MtnSubscriptionCallback = require("../models/MtnSubscriptionCallback");
const crypto = require("crypto");

exports.gameCentricCallback = async (req, res) => {
    try {
        const { phone } = req.body;

        if (!phone) {
            return res.status(400).json({
                status: "error",
                message: "Phone number is required"
            });
        }

        let msisdn = phone;

        if (msisdn.startsWith("0")) {
            msisdn = "233" + msisdn.substring(1);
        } else if (msisdn.length === 10 && /^\d{10}$/.test(msisdn)) {
            msisdn = "233" + msisdn;
        }

        const hashed = crypto
            .createHash("sha256")
            .update(msisdn)
            .digest("hex");

        const user = await MtnSubscriptionCallback.findOne({
            where: {
                msisdn: phone
            }
        });

        if (!user) {
            return res.status(404).json({
                status: "not_found",
                message: "No user found"
            });
        }

        return res.status(200).json({
            status: "active",
            message: "User found",
            phone: user.msisdn
        });

    } catch (err) {
        console.log("GameCentric Callback Error:", err);

        return res.status(500).json({
            status: "error",
            message: "Something went wrong"
        });
    }
};