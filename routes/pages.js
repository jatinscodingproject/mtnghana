const express = require("express");
const router = express.Router();
const PagesController = require("../controllers/PagesController");

router.get("/", PagesController.homePage);
router.get("/login", PagesController.loginPage);

router.post("/user-login", async (req, res) => {
    const { msisdn } = req.body;

    const offerCode = "9916710032";
    const redirectUrl = encodeURIComponent("http://mobile.arenaxpro.com/redirect");
    const transactionID = Date.now();

    const consentUrl =
        `https://sitcg.mtn.com.gh/Portal` +
        `?OfferCode=${offerCode}` +
        `&mobileNumber=${msisdn}` +
        `&redirectUrl=${redirectUrl}` +
        `&transactionID=${transactionID}`;

    return res.json({
        status: true,
        redirect: consentUrl
    });
});

const jwt = require("jsonwebtoken");

router.get("/redirect", (req, res) => {
    const { msisdn, transactionID } = req.query;
    console.log(req)
    console.log("redirect" , req.query)
   

    const token = jwt.sign(
        {
            msisdn: msisdn,
            transactionID,
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "15m",
        }
    );
    return res.redirect(
        `https://mobile.arenaxpro.com?token=${encodeURIComponent(token)}`
    );
});

router.post("/notify-callback", (req, res) => {
    try{
        console.log("callback" , req.body)
    }catch(error){
        console.log(error)
    }
});

module.exports = router
