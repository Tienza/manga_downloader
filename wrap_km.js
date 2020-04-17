'use strict'

const CryptoJS = require('crypto-js');
const fs = require('fs');

const helper = require('./helper');

const ivFile = './km_iv.txt';
const wrapKMKeyFile = './static_wrap_km_key.txt';

let ivUpdated = false;
let ivStr = fs.readFileSync(ivFile).toString();
let iv = CryptoJS.enc.Hex.parse(ivStr);

// Function to decrypt KM img hash
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
// Function to pass in multiple KM img hashes to be decrypted and returned
module.exports.decryptKMKeys = (wrapKMKey, encodedStrs) => {
    // Generate the CryptoJS key used to decrypt KM img hashes
    let key = CryptoJS.SHA256(helper.hexToAscii(wrapKMKey));
    if (ivUpdated) { // Check to is if the ivUpdated flag is set, if it is then update global variable
        iv = CryptoJS.enc.Hex.parse(fs.readFileSync(ivFile).toString());
        ivUpdated = false;
    }
    // Decode all img hashes that were passed in and return as str[]
    return encodedStrs.map((currVal) => decryptKMKey(key, currVal));
};
// Function to verify whether the initialization vector on KM has been changed and update accordingly
module.exports.decryptAndUpdateLoVars = (encodedStrs) => {
    let iv = encodedStrs[20].match(/^\"(.*)\"$/);
    iv = (iv.length > 1) ? iv[1] : helper.KM_INITIALIZATION_VECTOR;
    let loIV = helper.hexToAscii(iv);
    if (loIV !== ivStr) { // If the vector has changed then update ivFile with the new variable
        fs.writeFileSync(ivFile, loIV);
        // Flag the the IV has been updated so that the current stored variable will be updated
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