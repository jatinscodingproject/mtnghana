const Session = require("../models/model.session");

module.exports = async(req, res, next) => {
    const token = req.cookies.auth_token;

    if (!token) return res.redirect("/login");

    const session = await Session.findOne({ where: { token } });
    if (!session) return res.redirect("/login");

    if (new Date(session.valid_until) < new Date()) {
        await Session.destroy({ where: { token } });
        res.clearCookie("auth_token");
        return res.redirect("/login");
    }

    req.user = { id: session.user_id };
    next();
};