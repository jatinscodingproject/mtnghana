const axios = require("axios");

async function createHubtelRecurringInvoice(user, amount) {
    const url = `https://rip.hubtel.com/api/proxy/${process.env.SALESID}/create-invoice`;
    const authBase64 = Buffer.from(
        "B6yrG1X" + ":" + "4e2356ea2e824064b3f2ac3f079f233f"
    ).toString("base64");
    let msisdn = user.msisdn;

    if (msisdn.startsWith("0")) {
        msisdn = "233" + msisdn.substring(1);
    } else if (msisdn.length === 10 && /^\d{10}$/.test(msisdn)) {
        msisdn = "233" + msisdn;
    }
    let durationInHours = 24;

    if (user.subscription_type === "weekly") {
        durationInHours = 24 * 7;
    }

    if (user.subscription_type === "monthly") {
        durationInHours = 24 * 30;
    }

    console.log(amount)

    const orderDate = new Date();
    orderDate.setDate(orderDate.getDate() + 1); 
    const startTimeDate = new Date(
        orderDate.getTime() +
        durationInHours * 60 * 60 * 1000 -
        30 * 60 * 1000
    );
    const startTime = startTimeDate.toTimeString().substring(0, 5);
    const payload = {
        orderDate: orderDate.toISOString(),
        invoiceEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        description: `Subscription - ${user.subscription_type} ArenaXPro`,
        startTime: startTime,
        paymentInterval: user.subscription_type.toUpperCase(),
        customerMobileNumber: msisdn,
        paymentOption: "MobileMoney",
        channel: user.channel,
        customerName: user.name,
        recurringAmount: amount,
        totalAmount: amount,
        initialAmount: amount,
        currency: "GHS",
        callbackUrl: "https://arenaxpro.com/hubtel/callback"
    };

    console.log(payload);
    try {
        const response = await axios.post(url, payload, {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Basic ${authBase64}`
            }
        });
        return response.data

    } catch (err) {
        throw new Error("Failed to create Hubtel recurring invoice");
    }
}

module.exports = { createHubtelRecurringInvoice };