    const defaultConfig = {
        topbar_text: "Welcome to the Ultimate Gaming Experience!",
        brand_name_orange: "Game",
        brand_name_white: "On",
        hero_title: "Epic Gaming Awaits",
        hero_subtitle: "Join millions of players worldwide",
        esports_title: "Esports Arena",
        footer_text: "© 2024 GameOn. All rights reserved. Made with ❤️ for gamers worldwide."
    };

    let currentSlide = 0;
    let currentQuote = 0;

    const FREE_GAME_LIMIT = 20;
    const FREE_TIME_LIMIT = 2 * 60 * 1000;


    function changeSlide(direction) {
        const slides = document.querySelectorAll('.hero-slide');
        slides[currentSlide].classList.remove('active');
        currentSlide = (currentSlide + direction + slides.length) % slides.length;
        slides[currentSlide].classList.add('active');
        updateSlideIndicators();
    }

    function goToSlide(index) {
        const slides = document.querySelectorAll('.hero-slide');
        slides[currentSlide].classList.remove('active');
        currentSlide = index;
        slides[currentSlide].classList.add('active');
        updateSlideIndicators();
    }

    function updateSlideIndicators() {
        const indicators = document.querySelectorAll('.slide-indicator');

        indicators.forEach((indicator, index) => {
            indicator.style.opacity = index === currentSlide ? '1' : '0.5';
            indicator.style.transform = index === currentSlide ? 'scale(1.3)' : 'scale(1)';
        });
    }

    function autoSlide() {
        changeSlide(1);
    }

    function getCategory(name) {
        name = name.toLowerCase();

        if (name.includes("puzzle") || name.includes("match") || name.includes("find") || name.includes("color"))
            return "puzzle";

        if (name.includes("ninja") || name.includes("fight") || name.includes("tank") || name.includes("kill"))
            return "action";

        if (name.includes("restaurant") || name.includes("farm") || name.includes("cashier"))
            return "strategy";

        if (name.includes("run") || name.includes("jump") || name.includes("bird") || name.includes("car"))
            return "arcade";

        if (name.includes("goal") || name.includes("golf"))
            return "sports";

        return "arcade";
    }

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const card = entry.target;
                card.classList.add("visible");

                const img = card.querySelector("img");
                img.src = img.dataset.src;

                observer.unobserve(card);
            }
        });
    });

    function scheduleNextGameChunk() {
        if ("requestIdleCallback" in window) {
            requestIdleCallback(renderGamesInChunks, { timeout: 200 });
        } else {
            setTimeout(renderGamesInChunks, 40);
        }
    }
    const serverGames = [
        "airwar1941", "Ballsfun", "Bankrobbers", "Baseballcatcher", "Battletank",
        "Bikeracer", "Birdjumper", "Birds-Jump", "Birdyjump", "Blockit",
        "bluestory", "Boatracer", "Boom-Car", "BottleBlast/game", "Brainchallenger",
        "Bubble", "BunnyFunny", "CandyIslandAdventure", "Candyshop", "Castlerunner",
        "Cat-flap", "castel", "Cheesyrat", "ChopChop/game", "ColorValley/game",
        "Colourfulbook", "Cookie", "Crazy Runner", "DessertsMatch", "Digger-master",
        "Elefall", "Experiment", "FangedFunLP", "Farmmatch", "FasterorSlower/game",
        "FighterAircraft/game", "FindtheCat/game", "Fishybubbleshooter", "FlatBirdJump",
        "FlapyCherryBird", "Flip2match", "Fluffyrun", "FollowTheChemicalShapes",
        "FoxnRollPP-2", "FrogJump", "FunNpuzzle", "FunnyBearLauncher",
        "FunnyDragonJump", "FunnyRainyMan", "Funnypenguin", "Goal",
        "GoDown(u)", "GolfRush", "GroceryCashier/game", "GuessNumber/game",
        "HackerChallenge/game", "HelicopterControl", "Hideagift", "KidsPuzzle/game",
        "Kill-Rabbit", "KnightinLove/game", "Legoblocks", "Letsplayholi",
        "Match-color", "Minitractor", "NinjaJumper", "OpenRestaurant/game", "pandalove",
        "PaperShoot", "ParkingBoom", "PlanetSpin/game", "Pond", "PowerRunners",
        "rangervszombies", "RearrangeLetters/game", "ReverseGravity", "RobberRun/game",
        "Rotate360", "RunAtNorthPole", "RunVovanRun/game", "save-life",
        "ScaryPath", "ShadowNinja", "Side-Chain", "SkeletonLauncher",
        "Skyrace/game", "SkyWire", "SlowDown2", "SlotCarChallenge/game",
        "SnakevsBlock/game", "SpaceTreasureHunt", "squareadventure", "SummerMatch3/game",
        "SushiSwitch", "TheBoiledEggs/game", "thecaveoferror", "ThePuzzle", "timeball",
        "tom-jump", "Town-cars", "TrickshotBall/game", "TrueorFalse/game", "truth",
        "ufoflight", "Woblox", "YellowBlue"
    ];

    const GAME_CHUNK_SIZE = 2;
    let gameRenderIndex = 0;

    function renderGamesInChunks() {
        const end = Math.min(
            gameRenderIndex + GAME_CHUNK_SIZE,
            serverGames.length
        );

        for (; gameRenderIndex < end; gameRenderIndex++) {
            const game = serverGames[gameRenderIndex];
            const category = getCategory(game);
            const container = document.getElementById(`${category}Games`);
            if (!container) continue;

            const folder = game.split("/")[0];

            const card = document.createElement("div");
            card.className =
                "game-card card-2d bg-gray-800 rounded-xl overflow-hidden neon-border";

            card.innerHTML = `
                <div class="bg-gray-700 h-48 flex items-center justify-center text-4xl">
                    <img
                        data-src="https://arenaxpro.com/games/107Games/${folder}/img.png"
                        onerror="this.onerror=null; this.src='https://arenaxpro.com/games/107Games/${folder}/img.jpg';"
                    >
                </div>

                <div class="p-4">
                    <h3 class="text-xl font-bold text-white">${folder}</h3>
                    <button onclick="playGame('${game}')"
                        class="w-full mt-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white py-2 rounded-lg font-medium">
                        Play Now
                    </button>
                </div>
            `;

            observer.observe(card);
            container.appendChild(card);
        }

        // Continue rendering in background
        if (gameRenderIndex < serverGames.length) {
            scheduleNextGameChunk();
        }
    }

   async function playGame(game) {
    const token = localStorage.getItem("auth_token");
    const msisdn = localStorage.getItem("msisdn");

    // =====================================================
    // 1. NO TOKEN
    // =====================================================
    if (!token) {
        console.log("No auth token found.");

        subscribeNow();
        return;
    }

    // =====================================================
    // 2. NO MSISDN
    // =====================================================
    if (!msisdn) {
        console.log("No MSISDN found. Destroying token.");

        localStorage.removeItem("auth_token");
        localStorage.removeItem("msisdn");

        sessionStorage.removeItem("auth_token");
        sessionStorage.removeItem("msisdn");

        subscribeNow();
        return;
    }

    try {

        // =====================================================
        // 3. CHECK LATEST SUBSCRIPTION FROM SERVER
        // =====================================================
        const response = await fetch(
            `/check-subscription?msisdn=${encodeURIComponent(msisdn)}`,
            {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Accept": "application/json"
                }
            }
        );

        // =====================================================
        // 4. HTTP AUTH ERROR
        // =====================================================
        if (response.status === 401) {

            console.log(
                "Token is invalid or expired."
            );

            localStorage.removeItem("auth_token");
            localStorage.removeItem("msisdn");

            sessionStorage.removeItem("auth_token");
            sessionStorage.removeItem("msisdn");

            document
                .getElementById("gameModal")
                ?.classList.add("hidden");

            alert(
                "Your session has expired. Please subscribe again."
            );

            subscribeNow();

            return;
        }

        // =====================================================
        // 5. PARSE RESPONSE
        // =====================================================
        const data = await response.json();

        console.log(
            "Latest subscription check:",
            data
        );

        // Normalize status
        const subscriptionStatus = String(
            data.subscription_status || ""
        )
            .trim()
            .toUpperCase();

        // =====================================================
        // 6. USER IS UNSUBSCRIBED
        // Latest DB entry = D
        // =====================================================
        if (
            data.subscribed === false ||
            subscriptionStatus === "D" ||
            data.code === "SUBSCRIPTION_DEACTIVATED"
        ) {

            console.log(
                "Latest subscription is DEACTIVATED (D)."
            );

            console.log(
                "Destroying authentication token..."
            );

            // -----------------------------------------------
            // Destroy authentication
            // -----------------------------------------------
            localStorage.removeItem("auth_token");
            localStorage.removeItem("msisdn");

            sessionStorage.removeItem("auth_token");
            sessionStorage.removeItem("msisdn");

            // -----------------------------------------------
            // Close game modal
            // -----------------------------------------------
            document
                .getElementById("gameModal")
                ?.classList.add("hidden");

            const gameFrame =
                document.getElementById("gameFrame");

            if (gameFrame) {
                gameFrame.src = "about:blank";
            }

            alert(
                "Your subscription is inactive. Please subscribe again."
            );

            subscribeNow();

            return;
        }

        if (
            data.code === "NO_SUBSCRIPTION"
        ) {

            console.log(
                "No subscription record found."
            );

            localStorage.removeItem("auth_token");
            localStorage.removeItem("msisdn");

            sessionStorage.removeItem("auth_token");
            sessionStorage.removeItem("msisdn");

            document
                .getElementById("gameModal")
                ?.classList.add("hidden");

            alert(
                "No active subscription found. Please subscribe."
            );

            subscribeNow();

            return;
        }

        // =====================================================
        // 8. USER IS ACTIVE
        // =====================================================
        if (
            data.subscribed === true &&
            subscriptionStatus !== "D"
        ) {

            console.log(
                "Active subscription confirmed."
            );

            console.log(
                "Opening game:",
                game
            );

            // -----------------------------------------------
            // Open game modal
            // -----------------------------------------------
            const gameModal =
                document.getElementById("gameModal");

            if (gameModal) {
                gameModal.classList.remove("hidden");
            }

            // -----------------------------------------------
            // Load game
            // -----------------------------------------------
            const gameFrame =
                document.getElementById("gameFrame");

            if (!gameFrame) {
                console.error(
                    "Game iframe #gameFrame not found."
                );

                return;
            }

            gameFrame.src =
                `https://arenaxpro.com/games/107Games/${encodeURIComponent(game)}/index.html`;

            return;
        }

        // =====================================================
        // 9. UNKNOWN RESPONSE
        // =====================================================
        console.warn(
            "Unknown subscription response:",
            data
        );

        document
            .getElementById("gameModal")
            ?.classList.add("hidden");

        alert(
            "Unable to verify your subscription. Please try again."
        );

    } catch (error) {

        console.error(
            "Subscription check failed:",
            error
        );

        document
            .getElementById("gameModal")
            ?.classList.add("hidden");

        alert(
            "Unable to verify your subscription. Please try again."
        );
    }
}

    async function onConfigChange(config) {
        const setText = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        };

        setText('topbarText', config.topbar_text || defaultConfig.topbar_text);

        const brandNameEl = document.getElementById('brandName');
        if (brandNameEl) {
            brandNameEl.innerHTML = `<span class="text-orange-500">Game</span><span class="text-white">On</span>`;
        }

        setText('heroTitle', config.hero_title || defaultConfig.hero_title);
        setText('heroSubtitle', config.hero_subtitle || defaultConfig.hero_subtitle);

        const esportsTitleEl = document.getElementById('esportsTitle');
        if (esportsTitleEl) {
            const title = (config.esports_title || defaultConfig.esports_title).split(" ");
            esportsTitleEl.innerHTML = `<span class="text-orange-500">${title[0]}</span> ${title.slice(1).join(" ")}`;
        }

        setText('footerText', config.footer_text || defaultConfig.footer_text);
    }

    function scrollLeft(id) {
        document.getElementById(id).scrollLeft -= 300;
    }

    function scrollRight(id) {
        document.getElementById(id).scrollLeft += 300;
    }

    (function() {
        function c() {
            var b = a.contentDocument || a.contentWindow.document;
            if (b) {
                var d = b.createElement('script');
                d.innerHTML = "window.__CF$cv$params={r:'9a2ee173b45a4212',t:'MTc2Mzg4MjE4Mi4wMDAwMDA='};var a=document.createElement('script');a.nonce='';a.src='/cdn-cgi/challenge-platform/scripts/jsd/main.js';document.getElementsByTagName('head')[0].appendChild(a);";
                b.getElementsByTagName('head')[0].appendChild(d)
            }
        }
        if (document.body) {
            var a = document.createElement('iframe');
            a.height = 1;
            a.width = 1;
            a.style.position = 'absolute';
            a.style.top = 0;
            a.style.left = 0;
            a.style.border = 'none';
            a.style.visibility = 'hidden';
            document.body.appendChild(a);
            if ('loading' !== document.readyState) c();
            else document.addEventListener('DOMContentLoaded', c);
        }
    })();


    document.addEventListener("DOMContentLoaded", () => {
        const quotes = document.querySelectorAll("#quoteSlider .quote");

        if (quotes.length > 0) quotes[0].classList.add("active");

        function changeQuote() {
            quotes[currentQuote].classList.remove("active");
            currentQuote = (currentQuote + 1) % quotes.length;
            quotes[currentQuote].classList.add("active");
        }

        setInterval(changeQuote, 3000);
    });

    window.addEventListener("load", () => {
        setTimeout(() => {
            document.getElementById('loadingScreen').classList.add('hidden');
            document.getElementById('mainContent').classList.add('visible');
            renderGamesInChunks()
        }, 100);
    });


    async function unsubscribe() {
        if (!confirm("Are you sure you want to unsubscribe?")) {
            return;
        }

        try {
            const token = localStorage.getItem("auth_token");

            const response = await fetch("/unsubscribe", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            const data = await response.json();

            if (data.status) {
                alert("Unsubscribed successfully.");
                updateNavbarUI();
            } else {
                alert(data.message || "Unable to unsubscribe.");
            }
        } catch (err) {
            console.error(err);
        }
    }

    window.addEventListener("load", () => {
        updateNavbarUI();
        setTimeout(() => {
            document.getElementById('loadingScreen').classList.add('hidden');
            document.getElementById('mainContent').classList.add('visible');
            // renderGamesFromServer();
        }, 1000);
    });

    async function handleHeroPlay() {
        const token = localStorage.getItem("auth_token");

        if (!token) {
            window.location.href = "/login";
            return;
        }

        try {
            const response = await fetch("/validate-token-check-subscription", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            const data = await response.json();

            // ❌ Token invalid or expired
            if (["NO_TOKEN", "INVALID_TOKEN", "TOKEN_EXPIRED"].includes(data.code)) {
                localStorage.removeItem("auth_token");
                window.location.href = "/login";
                return;
            }

            // ❌ No subscription
            if (["NO_SUBSCRIPTION", "SUBSCRIPTION_EXPIRED"].includes(data.code)) {
                openSubscriptionModal(); // your existing modal
                return;
            }

            // ✅ Logged in + subscribed
            window.location.href = "/games";

        } catch (err) {
            console.error("Hero play validation failed:", err);
        }
    }

    async function subscribeNow() {
        const btn = document.getElementById("subscribeBtn");

        if (btn) {
            btn.disabled = true;
            btn.innerText = "Redirecting...";
        }

        window.addEventListener("pageshow", () => {
            if (btn) {
                btn.disabled = false;
                btn.innerText = "Subscribe Now";
            }
        }, { once: true });

        const offerCode = "9916710032";
        const redirectUrl = encodeURIComponent("http://mobile.arenaxpro.com/redirect");
        const transactionID = Date.now();

        let consentUrl = "";

        if (window.isHE && window.msisdn) {
            consentUrl =
                `http://98.71.49.187/Redirect` +
                `?OfferCode=${offerCode}` +
                `&mobileNumber=${window.msisdn}` +
                `&redirectUrl=${redirectUrl}` +
                `&transactionID=${transactionID}`;

            window.location.href = consentUrl;
        } else {
            window.location.href = "/login";
            return;
        }
    }