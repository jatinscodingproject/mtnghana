const CryptoJS = require("crypto-js");

const SECRET_KEY = process.env.ENCRYPTION_SECRET_KEY;

function encrypt(value) {
    if (!value) return null;
    return CryptoJS.AES.encrypt(value, SECRET_KEY).toString();
}

function decrypt(value) {
    if (!value) return null;
    const bytes = CryptoJS.AES.decrypt(value, SECRET_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
}

module.exports = { encrypt, decrypt };