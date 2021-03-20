'use strict'

const hooman = require('hooman');
const fs = require('fs');

const helper = require('./helper');

const MANGA_URL_PREFIX = 'https://kissmanga.org/';
const MANGA_CHAPTER_LIST_URL = MANGA_URL_PREFIX + '/manga/';
const MANGA_STATUS_REGEX = /Status\:\<\/span\>\s+(\w+)\<\/p\>/;
const MANGA_CHAPTER_URL_REGEX = /\<h3\>\s+\<a\shref\=\"(.*)\"\s+title\=/;

let captureChapterLinks = async (mangaName = '', trackedManga = JSON.parse(fs.readFileSync(helper.TRACKED_MANGA_FILE_NAME).toString()), completedManga = []) => {
    // Flag whether and update and pull needs to be preformed from the source
    let updatedNeeded = false;
    // Retrieve the object that stores all information for current manga
    let currManga = trackedManga[mangaName];
    // // Check to see if the status of the manga is pau
    if (currManga.paused === undefined || currManga.paused === null || !currManga.paused) {
        try {
             // Open the manga url in a headless browser - assign to response object
            let hoomanResponse = await hooman.get(MANGA_CHAPTER_LIST_URL + currManga.urlKey);
            let response = hoomanResponse.body;
            // Retrieve the manga's current status from the response body
            let mangaStatus = response.match(MANGA_STATUS_REGEX);
            // Assign the status to a variable, if no status found then assume Ongoing
            let status = (mangaStatus.length > 1) ? mangaStatus[1].trim() : helper.STATUS_ONGOING;
            // Retrieve all chapter links from the response body
            let totalChapters = response.match(new RegExp(MANGA_CHAPTER_URL_REGEX, 'g'))
                .map((currVal) => {
                    let chapter = currVal.match(MANGA_CHAPTER_URL_REGEX);
                    if (chapter.length > 1) {
                        return chapter[1];
                    }
                });
            // If the number of chapters found in the obj and the response body don't match
            if (currManga.tracked.length !== totalChapters.length) {
                updatedNeeded = true; // Flag that the manage has been updated
                console.log(`${mangaName}: Missing ${totalChapters.length - currManga.tracked.length} Chapter(s) | Download Limit: ${(currManga.limit !== undefined && currManga.limit !== null) ? currManga.limit : 'null'} | Status: ${status}`);
                // From all the chapter links, filter out the ones we currently do not track
                let missingChapterLinks = helper.setDiff(totalChapters, new Set(currManga.tracked));
                // Check if a limit has been set filter out the missingLinks again
                if (currManga.limit !== undefined && missingChapterLinks.length > currManga.limit) {
                    missingChapterLinks = missingChapterLinks.slice(missingChapterLinks.length - currManga.limit);
                }
                // Update tracked_manga object
                currManga.tracked = (currManga.limit === undefined || currManga.limit === null) ? totalChapters : missingChapterLinks.concat(currManga.tracked);
                // Append all the links that need to be downloaded to urls.txt
                fs.appendFileSync(helper.URLS_FILE_NAME,
                    missingChapterLinks.map((url) => MANGA_URL_PREFIX + url).join('\n') + '\n');
            } else { // Otherwise no updates nee to be performed
                console.log(`${mangaName}: All Caught Up! | Status: ${status}`);
            }
            // If a manga's status has been marked as Completed then store the manga's name
            if (status === helper.STATUS_COMPLETED) {
                completedManga.push(mangaName);
            }
        } catch (error) {
            console.log(error.response.body);
        }
    } else {
        console.log(`${mangaName}: Paused | Skipping...`);
    }
    return updatedNeeded;
};
// Export function to be invoked when chapter scraper is imported into another file
module.exports.captureChapterLinks = async (mangaName, trackedManga, completedManga) => {
    return captureChapterLinks(mangaName, trackedManga, completedManga);
};

if (typeof require != 'undefined' && require.main == module) {
    const sysArgs = process.argv.slice(2);
    return captureChapterLinks(sysArgs[0], true, sysArgs[1]);
}