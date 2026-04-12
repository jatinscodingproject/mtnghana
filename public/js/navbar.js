async function updateNavbarUI() {
    const token = localStorage.getItem("auth_token");

    const loginBtn = document.getElementById("loginBtn");
    const accountDropdown = document.getElementById("accountDropdown");

    const mobileLoginBtn = document.getElementById("mobileLoginBtn");
    const mobileAccountBox = document.getElementById("mobileAccountBox");

    const isValid = await validateToken();
    console.log(isValid)
    if (isValid) {
        if (loginBtn) loginBtn.style.display = "none";
        if (accountDropdown) accountDropdown.style.display = "flex";
        if (mobileLoginBtn) mobileLoginBtn.classList.add("hidden");
        if (mobileAccountBox) mobileAccountBox.classList.remove("hidden");

    } else {
        localStorage.removeItem("auth_token");
        if (loginBtn) loginBtn.style.display = "flex";
        if (accountDropdown) accountDropdown.style.display = "none";
        if (mobileLoginBtn) mobileLoginBtn.classList.remove("hidden");
        if (mobileAccountBox) mobileAccountBox.classList.add("hidden");
    }
}


window.addEventListener("load", () => {
    updateNavbarUI();
    setTimeout(() => {
        document.getElementById('loadingScreen').classList.add('hidden');
        document.getElementById('mainContent').classList.add('visible');
        renderGamesFromServer();
    }, 2500);
});

async function validateToken() {
    const token = localStorage.getItem("auth_token");
    console.log("Stored token:", token);
    if (!token) return false;

    try {
        const response = await fetch("/validate-token", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();
        if (!data.status) {
            localStorage.removeItem("auth_token");
            updateNavbarUI();
            return false;
        }

        return true;

    } catch (err) {
        console.error("Token validation error:", err);
        return false;
    }
}