require('dotenv').config();

function getPlanAmount(subscriptionType) {
    const plans = {
        monthly: process.env.MONTHLY,
        weekly: process.env.WEEKLY,
        daily: process.env.DAILY
    };
    return Number(plans[subscriptionType]) || null;
}

module.exports = getPlanAmount;