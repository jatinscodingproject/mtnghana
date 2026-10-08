const os = require("os");
const path = require("path");
const fs = require("fs");

let browser = null;
let puppeteer = null;
let browserPromise = null;

/**
 * Load Puppeteer dynamically.
 *
 * Newer Puppeteer versions can be ESM modules.
 */
async function getPuppeteer() {
    if (!puppeteer) {
        const module = await import("puppeteer");

        puppeteer = module.default || module;
    }

    return puppeteer;
}

/**
 * Create a unique Firefox profile directory.
 */
function createFirefoxProfile() {
    const platform = os.platform();

    let baseDirectory;

    if (platform === "linux") {
        baseDirectory = "/tmp";
    } else if (platform === "win32") {
        baseDirectory = "C:\\puppeteer";
    } else {
        throw new Error(
            `Unsupported operating system: ${platform}`
        );
    }

    /**
     * Make sure base directory exists.
     */
    fs.mkdirSync(baseDirectory, {
        recursive: true,
    });

    /**
     * Unique profile based on:
     * - process ID
     * - timestamp
     *
     * This prevents PM2 workers from sharing
     * the same Firefox profile.
     */
    const profileName =
        `mtnghana-firefox-${process.pid}-${Date.now()}`;

    const profilePath =
        path.join(
            baseDirectory,
            profileName
        );

    /**
     * Create the actual profile folder BEFORE
     * starting Firefox.
     */
    fs.mkdirSync(profilePath, {
        recursive: true,
        mode: 0o700,
    });

    /**
     * Verify that Firefox profile exists.
     */
    if (!fs.existsSync(profilePath)) {
        throw new Error(
            `Firefox profile could not be created: ${profilePath}`
        );
    }

    /**
     * Linux permissions.
     */
    if (platform === "linux") {
        try {
            fs.chmodSync(
                profilePath,
                0o700
            );
        } catch (error) {
            console.log(
                "⚠️ Could not change profile permissions:",
                error?.message || error
            );
        }
    }

    return profilePath;
}

/**
 * Get Firefox browser.
 */
async function getBrowser() {

    /**
     * Reuse currently running browser.
     *
     * Do NOT use browser.isConnected().
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
     * If Firefox is already being launched by another
     * request, wait for that launch.
     */
    if (browserPromise) {
        return browserPromise;
    }

    browserPromise = (async () => {

        const platform = os.platform();

        const isLinux =
            platform === "linux";

        const isWindows =
            platform === "win32";

        let executablePath;

        /**
         * ==============================
         * FIREFOX PATH
         * ==============================
         */
        if (isLinux) {

            executablePath =
                "/usr/bin/firefox";

        } else if (isWindows) {

            executablePath =
                "C:\\Program Files\\Mozilla Firefox\\firefox.exe";

        } else {

            throw new Error(
                `Unsupported operating system: ${platform}`
            );
        }

        /**
         * ==============================
         * CREATE UNIQUE PROFILE
         * ==============================
         */
        const userDataDir =
            createFirefoxProfile();

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

        /**
         * Verify executable exists.
         */
        if (!fs.existsSync(executablePath)) {

            throw new Error(
                `Firefox executable not found: ${executablePath}`
            );
        }

        try {

            const puppeteerLib =
                await getPuppeteer();

            /**
             * Firefox arguments.
             *
             * IMPORTANT:
             *
             * We explicitly pass:
             *
             *     -profile <directory>
             *
             * This avoids the "Could not find profile folder"
             * problem with the system Firefox installation.
             */
            const firefoxArgs = [
                "-no-remote",
                "-profile",
                userDataDir,
            ];

            /**
             * Linux-specific options.
             */
            if (isLinux) {
                firefoxArgs.push(
                    "-headless"
                );
            }

            /**
             * Windows-specific options.
             */
            if (isWindows) {
                firefoxArgs.push(
                    "-new-instance"
                );
            }

            console.log(
                "🦊 Firefox arguments:",
                firefoxArgs
            );

            /**
             * Launch Firefox.
             */
            const newBrowser =
                await puppeteerLib.launch({

                    browser: "firefox",

                    /**
                     * We explicitly control headless
                     * through Firefox arguments.
                     */
                    headless: false,

                    executablePath,

                    /**
                     * IMPORTANT:
                     *
                     * Do not pass userDataDir here.
                     *
                     * We explicitly pass Firefox's
                     * -profile argument above.
                     */
                    args: firefoxArgs,

                    acceptInsecureCerts: true,

                    slowMo: 100,

                    defaultViewport: null,

                    dumpio: true,
                });

            /**
             * Save browser.
             */
            browser = newBrowser;

            console.log(
                "🦊 Firefox launched successfully"
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

            /**
             * Handle Firefox disconnect.
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

            /**
             * Do not leave failed profiles behind.
             */
            try {

                fs.rmSync(
                    userDataDir,
                    {
                        recursive: true,
                        force: true,
                    }
                );

                console.log(
                    "🧹 Removed failed Firefox profile:",
                    userDataDir
                );

            } catch (cleanupError) {

                console.log(
                    "⚠️ Could not remove failed profile:",
                    cleanupError?.message ||
                        cleanupError
                );
            }

            throw error;
        }

    })();

    try {

        return await browserPromise;

    } finally {

        browserPromise = null;
    }
}

/**
 * Close Firefox.
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
 * Export.
 */
module.exports = {
    getBrowser,
    closeBrowser,
};