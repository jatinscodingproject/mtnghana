const User = require("../models/model.user");
const Invoice = require("../models/model.invoice");
const { createHubtelRecurringInvoice } = require("../utils/utils.hubtel");
const { cancelHubtelInvoice } = require("../utils/utils.cancelInvoice");
const getPlanAmount = require("../utils/utils.getPlanAmont");
const sequelize = require("../config/db");

exports.subscribeFromAccount = async(req, res) => {
    const t = await sequelize.transaction();

    try {
        const userId = req.user.id;

        // 🔹 Fetch user
        const user = await User.findByPk(userId, { transaction: t });
        if (!user) {
            await t.rollback();
            return res.redirect("/login");
        }

        const subscription_type = user.subscription_type;
        if (!subscription_type) {
            await t.rollback();
            return res.redirect("/account?error=No subscription type found");
        }

        // 🔹 Find latest unverified invoice
        const oldInvoice = await Invoice.findOne({
            where: {
                user_id: user.id,
                is_verified: true
            },
            order: [
                ["createdAt", "DESC"]
            ],
            transaction: t
        });

        // 🔹 Try canceling old invoice (failure allowed)
        if (oldInvoice) {
            try {
                await cancelHubtelInvoice(oldInvoice.invoice_number);
                console.log("Old invoice cancelled:", oldInvoice.invoice_number);
            } catch (err) {
                console.error(
                    "Old invoice cancel failed, proceeding anyway:",
                    err.message
                );

            }
        }

        const planAmount = getPlanAmount(subscription_type);
        const hubtelRes = await createHubtelRecurringInvoice(user, planAmount);

        await Invoice.create({
            user_id: user.id,
            invoice_number: hubtelRes.data.recurringInvoiceId,
            invoice_request_id: hubtelRes.data.requestId,
            invoice_prefix: hubtelRes.data.otpPrefix,
            msisdn: user.msisdn,
            is_verified: false
        }, { transaction: t });

        user.subscription_status = "pending";
        user.schedule_id = hubtelRes.scheduleId;
        await user.save({ transaction: t });

        await t.commit();

        req.session.verifyData = {
            invoice: hubtelRes.data.recurringInvoiceId,
            request: hubtelRes.data.requestId,
            prefix: hubtelRes.data.otpPrefix,
            msisdn: user.msisdn,
            sub_type: subscription_type,
            planAmount
        };

        return res.json({
            status: true,
            redirect: "/new-verify",
            data: {
                invoice: hubtelRes.data.recurringInvoiceId,
                sub_type: subscription_type,
                planAmount,
                request: hubtelRes.data.requestId,
                prefix: hubtelRes.data.otpPrefix,
                msisdn: user.msisdn
            }
        });


    } catch (error) {
        console.error("Subscription error:", error);
        await t.rollback();
        return res.redirect("/?error=Something went wrong");
    }
};