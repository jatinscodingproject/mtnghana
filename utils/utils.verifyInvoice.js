const axios = require("axios");

async function verifyHubtelInvoice(recurringInvoiceId, requestId, otpCode) {

    const url = `https://rip.hubtel.com/api/proxy/verify-invoice`;

    const authBase64 = Buffer.from(
        "B6yrG1X" + ":" + "4e2356ea2e824064b3f2ac3f079f233f"
    ).toString("base64");

    const payload = {
        recurringInvoiceId,
        requestId,
        otpCode
    };

    try {
        const response = await axios.post(url, payload, {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Basic ${authBase64}`
            }
        });

        return response.data;

    } catch (err) {
        console.log(err)
        throw new Error("Failed to verify invoice with Hubtel");
    }
}

module.exports = { verifyHubtelInvoice };