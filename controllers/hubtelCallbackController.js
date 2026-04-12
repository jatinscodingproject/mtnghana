const User = require("../models/model.user");
const Invoice = require("../models/model.invoice");
const Subscription = require("../models/model.subscription");
const sequelize = require("../config/db");
const crypto = require("crypto");

exports.hubtelCallback = async(req, res) => {
    const t = await sequelize.transaction()
    try {
        const cb = req.body;
        const data = cb.Data;
        console.log("callback response", cb)
        const invoice = await Invoice.findOne({
            where: { msisdn: data.CustomerMobileNumber }
        });

        if (!invoice) {
            return res.status(404).json({ message: "Invoice not found" });
        }
        const subStatus = cb.ResponseCode === "0000" ? "Active" : "Inactive";
        await Subscription.create({
            user_id: invoice.user_id,
            invoice_id: invoice.id,

            response_code: cb.ResponseCode,
            message: cb.Message,

            order_id: data.OrderId,
            description: data.Description,
            recurring_invoice_id: data.RecurringInvoiceId,
            transaction_id: data.TransactionId,
            external_transaction_id: data.ExternalTransactionId,

            charges: data.Charges,
            amount_charged: data.AmountCharged,
            amount_after_charges: data.AmountAfterCharges,
            amount: data.Amount,
            initial_amount: data.InitialAmount,
            recurring_amount: data.RecurringAmount,
            sub_status: subStatus,
            order_date: data.OrderDate,
            invoice_end_date: data.InvoiceEndDate,
            customer_mobile_number: data.CustomerMobileNumber
        }, { transaction: t });
        t.commit()
        console.log(new Date(), "callback received", data.CustomerMobileNumber)
        return res.status(200).json({ message: "Callback processed" });

    } catch (err) {
        t.rollback();
        return res.status(500).json({ message: "Callback failed" });
    }
};