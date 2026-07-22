


exports.homePage = async(req, res) => {
    try {
        let ip;
        console.log("<<<<<< headers" , req.headers)
        if (req.headers["x-forwarded-for"]) {
            ip = req.headers["x-forwarded-for"].split(",")[0];
        } else {
            ip = req.socket.remoteAddress;
        }
        const msisdn = req.headers.msisdn || null;
        res.render("pages/index", {
            title: "Home Page",
            msisdn,
            isHE: !!msisdn
        });


    } catch (error) {
        console.error(error);
        res.status(500).render("pages/error", {
            message: "Something went wrong!",
        });
    }
};

exports.loginPage = async(req, res) => {
    try {
        res.render("pages/login", {
            title: "Login Page",
        });
    } catch (error) {
        console.error(error);
        res.status(500).render("pages/error", {
            message: "Something went wrong!",
        });
    }
};


