const os = require("os");
const path = require("path");
const fs = require("fs");

let browser = null;
let puppeteer = null;
let browserPromise = null;

/**
 * Load Puppeteer dynamically.
 *
 * Newer Puppeteer versions can be ESM modules,
 * so we use dynamic import instead of require().
 */
async function getPuppeteer() {
    if (!puppeteer) {
        const module = await import("puppeteer");

        puppeteer = module.default || module;
    }

    return puppeteer;
}

/**
 * Get Firefox browser instance.
 */
async function getBrowser() {

    /**
     * Reuse existing browser.
     *
     * Do NOT use browser.isConnected()
     * because that function is not available
     * in your installed Puppeteer version.
     */
    if (browser) {
        try {
            if (
                typeof browser.connected === "undefined" ||
                browser.connected === true
            ) {
                return browser;
            }
        } catch (error) {
            console.log(
                "⚠️ Existing Firefox instance is not usable."
            );
        }

        browser = null;
    }

    /**
     * If another request is already starting Firefox,
     * wait for that same launch instead of launching
     * another Firefox instance.
     */
    if (browserPromise) {
        return browserPromise;
    }

    browserPromise = (async () => {

        const platform = os.platform();

        const isLinux = platform === "linux";
        const isWindows = platform === "win32";

        let executablePath;
        let userDataDir;

        /**
         * ==============================
         * LINUX SERVER
         * ==============================
         */
        if (isLinux) {

            executablePath = "/usr/bin/firefox";

            /**
             * IMPORTANT:
             *
             * Do not use one common Firefox profile
             * when multiple PM2 processes are running.
             *
             * Every PM2 process gets its own profile.
             */
            userDataDir = path.join(
                "/tmp",
                `mtnghana-firefox-${process.pid}`
            );
        }

        /**
         * ==============================
         * WINDOWS
         * ==============================
         */
        else if (isWindows) {

            executablePath =
                "C:\\Program Files\\Mozilla Firefox\\firefox.exe";

            /**
             * Separate profile for every
             * Node.js process.
             */
            userDataDir = path.join(
                "C:\\puppeteer",
                `firefox-profile-${process.pid}`
            );
        }

        /**
         * ==============================
         * UNSUPPORTED OS
         * ==============================
         */
        else {

            throw new Error(
                `Unsupported operating system: ${platform}`
            );
        }

        /**
         * Make sure Firefox profile directory exists.
         */
        fs.mkdirSync(userDataDir, {
            recursive: true
        });

        console.log(
            "🚀 Starting Firefox..."
        );

        console.log(
            `💻 OS: ${platform}`
        );

        console.log(
            `📍 Firefox: ${executablePath}`
        );

        console.log(
            `📁 Firefox profile: ${userDataDir}`
        );

        try {

            const puppeteerLib =
                await getPuppeteer();

            /**
             * Launch Firefox.
             */
            const newBrowser =
                await puppeteerLib.launch({

                    browser: "firefox",

                    /**
                     * Linux server:
                     * headless mode.
                     *
                     * Windows:
                     * visible Firefox window.
                     */
                    headless: isLinux
                        ? true
                        : false,

                    executablePath,

                    userDataDir,

                    /**
                     * Allow invalid/self-signed
                     * certificates.
                     */
                    acceptInsecureCerts: true,

                    /**
                     * Small delay between Puppeteer
                     * actions for stability.
                     */
                    slowMo: 100,

                    defaultViewport: null,

                    args: [

                        "--no-sandbox",

                        "--disable-setuid-sandbox",

                        "--disable-dev-shm-usage",

                        "--disable-infobars",

                        /**
                         * Windows only.
                         */
                        ...(isWindows
                            ? [
                                "--start-maximized"
                            ]
                            : [])
                    ],

                    dumpio: false
                });

            /**
             * Save browser instance.
             */
            browser = newBrowser;

            console.log(
                "🦊 Firefox launched successfully"
            );

            /**
             * Handle Firefox closing/crashing.
             */
            browser.on(
                "disconnected",
                () => {

                    console.log(
                        "⚠️ Firefox browser disconnected"
                    );

                    browser = null;
                }
            );

            return browser;

        } catch (error) {

            console.error(
                "❌ Firefox launch failed:"
            );

            console.error(
                error?.message || error
            );

            if (error?.stack) {
                console.error(
                    error.stack
                );
            }

            browser = null;

            throw error;
        }

    })();

    try {

        return await browserPromise;

    } finally {

        /**
         * Allow future launch attempts
         * after this launch finishes.
         */
        browserPromise = null;
    }
}

/**
 * Close Firefox browser.
 */
async function closeBrowser() {

    if (!browser) {

        console.log(
            "ℹ️ Firefox is already closed."
        );

        return;
    }

    try {

        console.log(
            "🛑 Closing Firefox..."
        );

        await browser.close();

    } catch (error) {

        console.error(
            "❌ Error closing Firefox:",
            error?.message || error
        );

    } finally {

        browser = null;

        console.log(
            "🛑 Firefox closed"
        );
    }
}

/**
 * Export functions.
 */
module.exports = {
    getBrowser,
    closeBrowser
};