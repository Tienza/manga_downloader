'use strict'

const CryptoJS = require('crypto-js');
const fs = require('fs');

const helper = require('./helper');

let iv = CryptoJS.enc.Hex.parse(helper.KM_IV);

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
module.exports.decryptKMKeys = (encodedStrs) => {
    // Generate the CryptoJS key used to decrypt KM img hashes
    let key = CryptoJS.SHA256(helper.WRAP_KM_KEY);
    // Decode all img hashes that were passed in and return as str[]
    return encodedStrs.map((currVal) => decryptKMKey(key, currVal));
};
// Function to verify whether the initialization vector on KM has been changed and update accordingly
module.exports.decryptAndUpdateLoVars = (encodedStrs) => {
    let ivUpdated = false;
    let ivMatch = encodedStrs[20].match(/^\"(.*)\"$/);
    let ivMatchString = (ivMatch.length > 1) ? ivMatch[1] : '';
    let loIV = (ivMatch.length > 1) ? helper.hexToAscii(ivMatchString) : helper.KM_IV;
    if (loIV !== helper.KM_IV) { // If the vector has changed then update ivFile with the new variable
        fs.writeFileSync(helper.KM_IV_FILE_NAME, loIV);
        // Flag the the IV has been updated so that the current stored variable will be updated
        ivUpdated = true;
        console.log('Initialization vector has changed, source file has been updated');
    }
    console.log('lo.js variables successfully verified')
    return ivUpdated;
};

if (typeof require != 'undefined' && require.main == module) {
    const key = CryptoJS.SHA256(helper.WRAP_KM_KEY);
    const sysArgs = process.argv.slice(2);

    console.log(decryptKMKey(key, sysArgs[0]));
 }