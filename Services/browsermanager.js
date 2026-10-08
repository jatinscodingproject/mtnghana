const puppeteer = require("puppeteer");

let browser = null;

async function getBrowser() {
    if (browser && browser.isConnected()) {
        return browser;
    }

    try {
        browser = await puppeteer.launch({
            browser: "firefox",

            headless: false,

            executablePath: "/usr/bin/firefox",

            slowMo: 100,

            defaultViewport: null,

            acceptInsecureCerts: true,

            dumpio: false,

            userDataDir: undefined,
        });

        console.log(
            "🦊 Firefox launched successfully"
        );

        console.log(
            "📍 Firefox path: /usr/bin/firefox"
        );

        browser.on("disconnected", () => {
            console.log(
                "⚠️ Firefox browser disconnected"
            );

            browser = null;
        });

        return browser;

    } catch (error) {
        console.error(
            "❌ Firefox launch failed:"
        );

        console.error(
            error?.message || error
        );

        if (error?.stack) {
            console.error(error.stack);
        }

        browser = null;

        throw error;
    }
}

module.exports = {
    getBrowser,
};