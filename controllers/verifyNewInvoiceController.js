const User = require("../models/model.user");
const Invoice = require("../models/model.invoice");
const crypto = require("crypto");
const { verifyHubtelInvoice } = require("../utils/utils.verifyInvoice");
const sequelize = require("../config/db");

exports.verifyNewOtp = async(req, res) => {
    const t = await sequelize.transaction();
    try {
        if (!req.session.verifyData) {
            await t.rollback();
            return res.redirect("/");
        }

        const {
            invoice,
            request,
            prefix,
            msisdn
        } = req.session.verifyData;

        const { otp1, otp2, otp3, otp4 } = req.body;

        if (!otp1 || !otp2 || !otp3 || !otp4) {
            await t.rollback();
            return res.render("pages/newverify", {
                ...req.session.verifyData,
                error: "OTP is required"
            });
        }

        const otpCode = `${prefix}-${otp1}${otp2}${otp3}${otp4}`;

        const hubtelVerify = await verifyHubtelInvoice(
            invoice,
            request,
            otpCode
        );

        if (hubtelVerify.responseCode !== "0001") {
            await t.rollback();
            return res.render("pages/newverify", {
                ...req.session.verifyData,
                error: "Invalid OTP. Try again."
            });
        }

        let normalizedMsisdn = msisdn;
        if (normalizedMsisdn.startsWith("0")) {
            normalizedMsisdn = "233" + normalizedMsisdn.substring(1);
        } else if (/^\d{10}$/.test(normalizedMsisdn)) {
            normalizedMsisdn = "233" + normalizedMsisdn;
        }

        const invoiceRecord = await Invoice.findOne({
            where: { invoice_number: invoice },
            transaction: t,
            lock: t.LOCK.UPDATE
        });

        if (!invoiceRecord) {
            throw new Error("Invoice not found");
        }

        if (invoiceRecord.is_verified) {
            await t.rollback();
            return res.redirect("/login?verified=already");
        }

        invoiceRecord.is_verified = true;
        await invoiceRecord.save({ transaction: t });

        const hashed = crypto
            .createHash("sha256")
            .update(normalizedMsisdn)
            .digest("hex");

        const user = await User.findOne({
            where: { msisdn_hash: hashed },
            transaction: t,
            lock: t.LOCK.UPDATE
        });

        if (!user) {
            throw new Error("User not found");
        }

        user.isverify = true;
        user.subscription_status = "active";
        await user.save({ transaction: t });

        await t.commit();

        req.session.verifyData = null;

        return res.redirect(`/login?verified=${normalizedMsisdn}`);

    } catch (error) {
        await t.rollback();
        return res.render("pages/newverify", {
            ...(req.session.verifyData || {}),
            error: "Something went wrong. Please try again."
        });
    }
};