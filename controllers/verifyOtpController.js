const User = require("../models/model.user");
const Invoice = require("../models/model.invoice");
const crypto = require("crypto");
const { verifyHubtelInvoice } = require("../utils/utils.verifyInvoice");
const sequelize = require("../config/db");

exports.verifyOtp = async(req, res) => {
    const t = await sequelize.transaction();
    try {
        const { invoice, request, prefix, msisdn, otp1, otp2, otp3, otp4 } = req.body;
        const otpCode = `${prefix}-${otp1}${otp2}${otp3}${otp4}`;
        const hubtelVerify = await verifyHubtelInvoice(invoice, request, otpCode);
        console.log('hubtelVerify', hubtelVerify)
        if (hubtelVerify.responseCode !== "0001") {
            return res.render("pages/verify", {
                msisdn,
                prefix,
                invoice,
                request,
                error: "Invalid OTP. Try again."
            });
        }

        if (msisdn.startsWith("0")) {
            msisdn = "233" + msisdn.substring(1);
        } else if (msisdn.length === 10 && /^\d{10}$/.test(msisdn)) {
            msisdn = "233" + msisdn;
        }
        const invoiceRecord = await Invoice.findOne({ where: { invoice_number: invoice } });
        invoiceRecord.is_verified = true;
        await invoiceRecord.save({ transaction: t });
        const hashed = crypto.createHash("sha256").update(msisdn).digest("hex");
        const user = await User.findOne({ where: { msisdn_hash: hashed } });
        user.isverify = true;
        await user.save({ transaction: t });
        await t.commit();
        return res.redirect(`/login?verified=${msisdn}`);

    } catch (error) {
        await t.rollback();
        console.log("VERIFY OTP CONTROLLER ERROR:", error);
        return res.redirect("/verify?error=Something went wrong");
    }
};