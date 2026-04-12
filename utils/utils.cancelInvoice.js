const axios = require("axios");

async function cancelHubtelInvoice(recurringInvoiceId) {

    const url = `https://rip.hubtel.com/api/proxy/${process.env.SALESID}/cancel-invoice/${recurringInvoiceId}`;

    const authBase64 = Buffer.from(
        "B6yrG1X" + ":" + "4e2356ea2e824064b3f2ac3f079f233f"
    ).toString("base64");


    try {
        const response = await axios.delete(url, {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Basic ${authBase64}`
            }
        });

        return response.data;

    } catch (err) {
        // console.log(err)
        throw new Error("Failed to Cancel invoice with Hubtel");
    }
}

module.exports = { cancelHubtelInvoice };