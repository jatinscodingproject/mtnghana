const cron = require("node-cron");
const { Op } = require("sequelize");
const Subscription = require("../models/model.subscription");
const User = require("../models/model.user");

cron.schedule("* * * * *", async() => {
    console.log("Running subscription cron...");

    try {
        const activeSubs = await Subscription.findAll({
            where: { sub_status: "Active" }
        });

        const now = new Date();

        for (const sub of activeSubs) {
            const user = await User.findByPk(sub.user_id);
            if (!user) {
                console.warn(`Subscription ${sub.id} has no matching user ${sub.user_id}`);
                continue;
            }

            const type = (user.subscription_type || "daily").toLowerCase();

            let allowedHours = 24;
            if (type === "weekly") allowedHours = 24 * 7;
            if (type === "monthly") allowedHours = 24 * 28;

            const createdAt = new Date(sub.createdAt || sub.updatedAt || sub.order_date);
            const expiryDate = new Date(createdAt.getTime() + allowedHours * 60 * 60 * 1000);

            if (now >= expiryDate) {
                console.log(`Expiring sub ${sub.id} for user ${user.id}`);
                await sub.update({ sub_status: "Expired" });
                if (user.autorenew) {
                    try { await user.update({ autorenew: false }); } catch (e) { console.warn("Failed to update user.autorenew", e); }
                }
            }
        }

        console.log("Subscription cron completed.");
    } catch (err) {
        console.error("CRON ERROR:", err);
    }
});