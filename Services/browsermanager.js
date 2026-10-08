const os = require("os");

let browser = null;
let puppeteer = null;

/**
 * Load Puppeteer dynamically because newer Puppeteer
 * versions are ESM modules.
 */
async function getPuppeteer() {
    if (!puppeteer) {
        const module = await import("puppeteer");
        puppeteer = module.default || module;
    }

    return puppeteer;
}

async function getBrowser() {
    if (browser && browser.isConnected()) {
        return browser;
    }

    const isLinux = os.platform() === "linux";
    const isWindows = os.platform() === "win32";

    let executablePath;
    let userDataDir;

    if (isLinux) {
        executablePath = "/usr/bin/firefox";
        userDataDir = "/root/puppeteer/firefox-profile";
    } else if (isWindows) {
        executablePath =
            "C:\\Program Files\\Mozilla Firefox\\firefox.exe";

        userDataDir =
            "C:\\puppeteer\\firefox-profile";
    } else {
        throw new Error(
            `Unsupported operating system: ${os.platform()}`
        );
    }

    try {
        const puppeteerLib = await getPuppeteer();

        browser = await puppeteerLib.launch({
            browser: "firefox",

            // Linux server = headless
            // Windows = visible browser
            headless: isLinux ? true : false,

            executablePath,

            userDataDir,

            acceptInsecureCerts: true,

            slowMo: 100,

            defaultViewport: null,

            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--disable-infobars",

                ...(isLinux
                    ? []
                    : ["--start-maximized"]),
            ],

            dumpio: false,
        });

        console.log(
            "🦊 Firefox launched successfully"
        );

        console.log(
            "💻 OS:",
            os.platform()
        );

        console.log(
            "📍 Firefox:",
            executablePath
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

async function closeBrowser() {
    if (browser) {
        try {
            await browser.close();
        } catch (error) {
            console.error(
                "❌ Error closing Firefox:",
                error?.message || error
            );
        }

        browser = null;

        console.log(
            "🛑 Firefox closed"
        );
    }
}

module.exports = {
    getBrowser,
    closeBrowser
};