const User = require("../models/model.user");
const Invoice = require("../models/model.invoice");
const { createHubtelRecurringInvoice } = require("../utils/utils.hubtel");
const getPlanAmount = require("../utils/utils.getPlanAmont");
const crypto = require("crypto");
const sequelize = require("../config/db");

exports.resendOtp = async(req, res) => {
    const t = await sequelize.transaction();
    const { msisdn } = req.body;

    try {
        if (!msisdn) {
            return res.redirect("/verify?error=MSISDN required");
        }

        const hashed = crypto.createHash("sha256").update(msisdn).digest("hex");

        const user = await User.findOne({
            where: { msisdn_hash: hashed }
        });

        if (!user) {
            return res.redirect("/verify?error=User not found");
        }

        const planAmount = getPlanAmount(user.subscription_type);
        const hubtelRes = await createHubtelRecurringInvoice(user, planAmount);

        const invoice = await Invoice.create({
            user_id: user.id,
            invoice_number: hubtelRes.data.recurringInvoiceId,
            invoice_request_id: hubtelRes.data.requestId,
            invoice_prefix: hubtelRes.data.otpPrefix,
            msisdn: user.msisdn
        }, { transaction: t });

        user.schedule_id = hubtelRes.data.recurringInvoiceId;
        await user.save({ transaction: t });

        await t.commit();

        return res.render("pages/verify", {
            invoice: hubtelRes.data.recurringInvoiceId,
            request: hubtelRes.data.requestId,
            prefix: hubtelRes.data.otpPrefix,
            msisdn: user.msisdn,
            message: "OTP sent again successfully",
            sub_type: user.subscription_type,
            planAmount: planAmount
        });

    } catch (error) {
        if (!t.finished) await t.rollback();
        return res.redirect("/verify?error=Something went wrong");
    }
};