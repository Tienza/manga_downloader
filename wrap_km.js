'use strict'

const CryptoJS = require('crypto-js');
const fs = require('fs');
const helper = require('./helper');

const ivFile = './km_iv.txt';
const wrapKMKeyFile = './static_wrap_km_key.txt';

let ivUpdated = false;
let ivStr = fs.readFileSync(ivFile).toString();
let iv = CryptoJS.enc.Hex.parse(ivStr);

let decryptKMKey = (key, str) => {
    let r20 = CryptoJS.lib.CipherParams.create({
        ciphertext: CryptoJS.enc.Base64.parse(str)
    });
    let plaintext = CryptoJS.AES.decrypt(r20, key, {
        mode: CryptoJS.mode.CBC,
        iv: iv,
        padding: CryptoJS.pad.Pkcs7
    });

    return plaintext.toString(CryptoJS.enc.Utf8);
};

module.exports.decryptKMKeys = (wrapKMKey, encodedStrs) => {
    let chko = helper.hexToAscii(wrapKMKey);
    let key = CryptoJS.SHA256(chko);

    if (ivUpdated) {
        iv = CryptoJS.enc.Hex.parse(fs.readFileSync(ivFile).toString());
        ivUpdated = false;
    }

    return encodedStrs.map((currVal) => decryptKMKey(key, currVal));
};

module.exports.decryptAndUpdateLoVars = (encodedStrs) => {
    // Verify that the initialization vector hasn't changed
    let loIV = helper.hexToAscii(encodedStrs[20].match(/^\"(.*)\"$/)[1]);
    if (loIV !== ivStr) { // If the vector has changed then update ivFile with the new variable
        fs.writeFileSync(ivFile, loIV);
        ivUpdated = true;
        console.log('Initialization vector has changed, source file has been updated');
    }
    console.log('lo.js variables successfully verified')
};

if (typeof require != 'undefined' && require.main == module) {
    const key = CryptoJS.SHA256(fs.readFileSync(wrapKMKeyFile).toString());
    const sysArgs = process.argv.slice(2);

    console.log(decryptKMKey(key, sysArgs[0]));
 }