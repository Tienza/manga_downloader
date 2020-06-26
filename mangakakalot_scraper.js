'use strict'

const hooman = require('hooman');
const fs = require('fs');

const helper = require('./helper');

const IMG_PAGE_FILTER_REGEX = /\<div\sclass\=\"breadcrumb\sbreadcrumbs\sbred\_doc\"\>\s+(.*)\<select\sid\=\"c_chapter_bottom\"\sonchange\=\"Changes\(\'c_chapter_bottom\'\)\;\"\>/s;
const IMG_URL_REGEX = /\<img\ssrc\=\"(.*)\"\s+alt\=\"/;

// Function to capture and store all the relevant img links from KM link passed in
let capturePageImageLinks = async (url, writeToFile = false, outputFileName = helper.DEFAULT_IMG_SRC, callback = null) => {
    // Open url in headless browser and wait for cloudflare DDOS protection to pass
    try {
        const chapterPage = await hooman.get(url);
        let chapterPageHTML = chapterPage.body;
        let filterPage = chapterPageHTML.match(IMG_PAGE_FILTER_REGEX);
        chapterPageHTML = (filterPage.length > 0) ? filterPage[0] : chapterPageHTML;
        let imgURLs = chapterPageHTML.match(new RegExp(IMG_URL_REGEX, 'g')).map((currVal) => {
            let imgURL = currVal.match(IMG_URL_REGEX);
            if (imgURL.length > 1) return imgURL[1];
        });
        // If user wants the links written to a file then generate the file, else print to console
        if (writeToFile) {
            fs.writeFileSync(outputFileName, imgURLs.join('\n'));
            console.log(`${outputFileName} successfully written`);
        } else {
            console.log(imgLinks);
        }
        console.log('Successfully retrieved image links');
        // If a callback function was passed in and is valid, invoke callback function
        if (callback) {
            callback();
        }
    } catch (error) {
        console.log(error.response.body);
        //=> 'Internal server error ...'
    }
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

// const chapterList = await hooman.get(chapterListURL);
// let chapterListHTML = chapterList.body;
// let pageStatus = chapterListHTML.match(CHAPTER_STATUS_REGEX);
// let status = (pageStatus.length > 1) ? pageStatus[1] : helper.STATUS_ONGOING;
// let totalChapters = chapterListHTML.match(new RegExp(CHAPTER_URL_REGEX, 'g')).map((currVal) => {
//     let chapter = currVal.match(CHAPTER_URL_REGEX);
//     if (chapter.length > 1) return chapter[1];
// });
// console.log(status);
// console.log(totalChapters);
