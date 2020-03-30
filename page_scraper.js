'use strict'

const cloudscraper = require('cloudscraper');
const fs = require('fs');
const wrapKM = require('./wrap_km');
const helper = require('./helper')

const loURL = 'https://kissmanga.com/Scripts/lo.js';
const defaultOutputFileName = './img_sources.txt';

let capturePageImageLinks = async (url, writeToFile = false, outputFileName = defaultOutputFileName, callback = null) => {
    await cloudscraper.get(url).then((response) => {
        let wrapKAKey = response.match(/var\s+\_0x336e\s+\=\s+\[\"(.*)\"\]\;\s+chko\s+\=\s+_0x336e\[0\];\s+key\s\=\s+CryptoJS.SHA256\(chko\)/)[1];
        let imgMatches = response.match(/lstImages\.push\(wrapKA\(\"(.*)\"\)\);/g);
        
        let encodedStrs = imgMatches.map((currVal) => currVal.match(/lstImages\.push\(wrapKA\(\"(.*)\"\)\);/)[1]);
        let imgLinks = wrapKM.decryptKMKeys(wrapKAKey, encodedStrs).join('\n');

        console.log('Successfully retrieved image links');

        if (writeToFile) {
            fs.writeFileSync(outputFileName, imgLinks);
            console.log(`${outputFileName} successfully written`);
        } else {
            console.log(imgLinks);
        }
        if (callback) {
            callback();
        }
    }, console.error);
};

module.exports.checkAndUpdateKMVariables = async () => {
    await cloudscraper.get(loURL).then((response) => {
        let loVars = response.match(/var\s+\_0x331e\=\[(.*)\];\(function\(\_0xfac5x1/)[1].split(',');
        wrapKM.decryptAndUpdateLoVars(loVars);
    }, console.error);
};

module.exports.getImageLinks = async (url, outputFileName = defaultOutputFileName, callback = null) => {
    console.log(`Retrieving image linkes from: ${url}`);
    capturePageImageLinks(url, true, outputFileName, callback);
};

if (typeof require != 'undefined' && require.main == module) {
    const sysArgs = process.argv.slice(2);
    capturePageImageLinks(sysArgs[0], true, sysArgs[1]);
}
