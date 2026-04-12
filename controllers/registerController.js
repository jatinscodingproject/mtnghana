const User = require("../models/model.user");
const { createHubtelRecurringInvoice } = require("../utils/utils.hubtel");
const getPlanAmount = require("../utils/utils.getPlanAmont");
const crypto = require("crypto");
const sequelize = require("../config/db");
const Invoice = require("../models/model.invoice");
require("dotenv").config();

exports.registerUser = async(req, res) => {
    const t = await sequelize.transaction();
    let { name, msisdn, channel, subscription_type } = req.body;

    try {
        if (!name || !msisdn || !channel || !subscription_type) {
            return res.redirect(
                `/register?error=${encodeURIComponent("All fields are required")}` +
                `&name=${encodeURIComponent(name || "")}` +
                `&msisdn=${encodeURIComponent(msisdn || "")}` +
                `&subscription_type=${encodeURIComponent(subscription_type || "")}` +
                `&channel=${encodeURIComponent(channel || "")}`
            );
        }

        if (msisdn.startsWith("0")) {
            msisdn = "233" + msisdn.substring(1);
        } else if (msisdn.length === 10 && /^\d{10}$/.test(msisdn)) {
            msisdn = "233" + msisdn;
        }

        const msisdnHash = crypto.createHash("sha256").update(msisdn).digest("hex");

        const existing = await User.findOne({ where: { msisdn_hash: msisdnHash } });

        if (existing && existing.isverify === true) {
            return res.redirect(
                `/register?error=${encodeURIComponent("MSISDN already registered")}` +
                `&name=${encodeURIComponent(name)}` +
                `&msisdn=${encodeURIComponent(msisdn)}` +
                `&subscription_type=${encodeURIComponent(subscription_type)}` +
                `&channel=${encodeURIComponent(channel)}`
            );
        }

        let user;

        if (existing && existing.isverify === false) {
            user = existing;
            user.name = name;
            user.channel = channel;
            user.subscription_type = subscription_type;
            user.autorenew = true;
            await user.save({ transaction: t });
        } else if (!existing) {
            user = await User.create({
                name,
                msisdn,
                msisdn_hash: msisdnHash,
                channel,
                subscription_type,
                autorenew: true
            }, { transaction: t });
        }

        const planAmount = getPlanAmount(subscription_type);
        console.log(planAmount)
        const hubtelRes = await createHubtelRecurringInvoice(user, planAmount);
        console.log("hubtelRes", hubtelRes);
        await Invoice.create({
            user_id: user.id,
            invoice_number: hubtelRes.data.recurringInvoiceId,
            invoice_request_id: hubtelRes.data.requestId,
            invoice_prefix: hubtelRes.data.otpPrefix,
            msisdn: user.msisdn,
        }, { transaction: t });

        user.schedule_id = hubtelRes.scheduleId;
        user.subscription_status = "active";
        await user.save({ transaction: t });

        await t.commit();

        return res.render("pages/verify", {
            invoice: hubtelRes.data.recurringInvoiceId,
            sub_type: subscription_type,
            planAmount: planAmount,
            request: hubtelRes.data.requestId,
            prefix: hubtelRes.data.otpPrefix,
            msisdn
        });

    } catch (error) {
        console.error(error);
        await t.rollback();

        return res.redirect(
            `/register?error=${encodeURIComponent("Something went wrong. Try again.")}` +
            `&name=${encodeURIComponent(name || "")}` +
            `&msisdn=${encodeURIComponent(msisdn || "")}` +
            `&subscription_type=${encodeURIComponent(subscription_type || "")}` +
            `&channel=${encodeURIComponent(channel || "")}`
        );
    }
};