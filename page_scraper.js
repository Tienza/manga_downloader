'use strict'

const cloudscraper = require('cloudscraper');
const fs = require('fs');
const wrapKM = require('./wrap_km');
const helper = require('./helper')

const loURL = 'https://kissmanga.com/Scripts/lo.js';

const kmPageImgLinksRegex = /lstImages\.push\(wrapKA\(\"(.*)\"\)\);/; 
const kmWrapKAKeyRegex = /var\s+\_0x336e\s+\=\s+\[\"(.*)\"\]\;\s+chko\s+\=\s+_0x336e\[0\];\s+key\s\=\s+CryptoJS.SHA256\(chko\)/;

// Function to capture and store all the relevant img links from KM link passed in
let capturePageImageLinks = async (url, writeToFile = false, outputFileName = helper.DEFAULT_IMG_SRC, callback = null) => {
    // Open url in headless browser and wait for cloudflare DDOS protection to pass
    await cloudscraper.get(url).then((response) => {
        // Retrieve the WrapKA Key from the response body
        let wrapKAKey = response.match(kmWrapKAKeyRegex)[1];
        // Retrieve all relevant img hashes from the response body
        let imgMatches = response.match(new RegExp(kmPageImgLinksRegex, 'g'));
        // From the img hashes previously retrieved, remove unnecessary text and return just img hash
        let encodedStrs = imgMatches.map((currVal) => currVal.match(kmPageImgLinksRegex)[1]);
        // Decode all img hashes and return the img download links
        let imgLinks = wrapKM.decryptKMKeys(wrapKAKey, encodedStrs).join('\n');
        console.log('Successfully retrieved image links');
        // If user wants the links written to a file then generate the file, else print to console
        if (writeToFile) {
            fs.writeFileSync(outputFileName, imgLinks);
            console.log(`${outputFileName} successfully written`);
        } else {
            console.log(imgLinks);
        }
        // If a callback function was passed in and is valid, invoke callback function
        if (callback) {
            callback();
        }
    }, console.error);
};
// Function to query ${loURL} and retrieve all relevant variables to be verified
module.exports.checkAndUpdateKMVariables = async () => {
    await cloudscraper.get(loURL).then((response) => {
        let loVars = response.match(/var\s+\_0x331e\=\[(.*)\];\(function\(\_0xfac5x1/)[1].split(',');
        wrapKM.decryptAndUpdateLoVars(loVars);
    }, console.error);
};
// Export function to be invoked when page_scraper is imported into another file
module.exports.getImageLinks = async (url, outputFileName = helper.DEFAULT_IMG_SRC, callback = null) => {
    console.log(`Retrieving image linkes from: ${url}`);
    capturePageImageLinks(url, true, outputFileName, callback);
};

if (typeof require != 'undefined' && require.main == module) {
    const sysArgs = process.argv.slice(2);
    capturePageImageLinks(sysArgs[0], true, sysArgs[1]);
}
