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

        // Clean phone number
        let msisdn = String(phone).trim().replace(/\D/g, "");

        // Convert to database format: 544582322
        if (msisdn.startsWith("233")) {
            msisdn = msisdn.substring(3);
        } else if (msisdn.startsWith("0")) {
            msisdn = msisdn.substring(1);
        }

        console.log("Original phone:", phone);
        console.log("Cleaned MSISDN:", msisdn);

        // Fetch ONLY the latest subscription entry
        const user = await MtnSubscriptionCallback.findOne({
            where: {
                msisdn: msisdn
            },
            order: [
                ["createdAt", "DESC"]
            ]
        });

        // No record found
        if (!user) {
            return res.status(404).json({
                status: "not_found",
                message: "No user found",
                phone: msisdn
            });
        }

        console.log("Latest subscription record:", user.toJSON());

        // Allow ONLY if latest subscription status is A
        if (user.subscription_status !== "A") {
            return res.status(403).json({
                status: "inactive",
                message: "User subscription is not active",
                phone: user.msisdn,
                subscription_status: user.subscription_status
            });
        }

        // Latest record is ACTIVE
        return res.status(200).json({
            status: "active",
            message: "User subscription is active",
            phone: user.msisdn,
            subscription_status: user.subscription_status
        });

    } catch (err) {
        console.log("GameCentric Callback Error:", err);

        return res.status(500).json({
            status: "error",
            message: "Something went wrong"
        });
    }
};