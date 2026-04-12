const jwt = require("jsonwebtoken");
const User = require("../models/model.user");
const Subscription = require("../models/model.subscription");
const sequelize = require("../config/db");
require("dotenv").config();
const Session = require("../models/model.session");
const crypto = require("crypto");

exports.loginUser = async(req, res) => {
    const t = await sequelize.transaction();

    try {
        let { msisdn } = req.body;
        if (!msisdn) {
            await t.rollback();
            return res.json({
                status: false,
                message: "Phone number is required"
            });
        }

        if (msisdn.startsWith("0")) {
            msisdn = "233" + msisdn.substring(1);
        } else if (msisdn.length === 10 && /^\d{10}$/.test(msisdn)) {
            msisdn = "233" + msisdn;
        }
        const phoneHash = crypto.createHash("sha256")
            .update(msisdn)
            .digest("hex");

        const user = await User.findOne({
            where: { msisdn_hash: phoneHash },
            transaction: t,
            lock: t.LOCK.UPDATE
        });

        if (!user) {
            await t.rollback();
            return res.json({
                status: false,
                message: "Account not found. Please register."
            });
        }

        await Session.destroy({
            where: { user_id: user.id },
            transaction: t
        });

        const token = jwt.sign({ userId: user.id, msisdn },
            process.env.JWT_SECRET, { expiresIn: "1d" }
        );

        const validUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);

        await Session.create({
            user_id: user.id,
            token,
            valid_until: validUntil
        }, { transaction: t });

        await t.commit();

        res.cookie("auth_token", token, {
            httpOnly: true,
            sameSite: "lax",
            secure: false
        });

        return res.json({
            status: true,
            token,
            redirect: "/"
        });

    } catch (err) {
        console.log(err)
        await t.rollback();

        return res.json({
            status: false,
            message: "Something went wrong",
            error: err.message
        });
    }
};