'use strict'

const fs = require('fs');
const hooman = require('hooman');

const mangaChapterListScraper = require('./kissmanga_chapter_list_scraper');
const bulkDownloader = require('./bulk_manga_downloader');
const helper = require('./helper');

const sysArgs = new Set(process.argv);

(async () => {
    console.log('Updating Tracker File && Writing New Downloads Links...');
    // If the ./urls.txt doesn't exit, then create it
    if (!fs.existsSync(helper.URLS_FILE_NAME)) {
        fs.writeFileSync(helper.URLS_FILE_NAME, '');
    }
    // If the tracked_manga.json doesn't exist, then create it
    if (!fs.existsSync(helper.TRACKED_MANGA_FILE_NAME)) {
        fs.writeFileSync(helper.TRACKED_MANGA_FILE_NAME, '{}');
    }
    // If the title_mapper.json doesn't exist, then create it
    if (!fs.existsSync(helper.TITLE_MAPPER_FILE_NAME)) {
        fs.writeFileSync(helper.TITLE_MAPPER_FILE_NAME, '{}');
    }
    // Set initial run variables
    let updatedNeeded = false;
    let completedManga = [];
    // Read in the tracked_manga JSON object to start tracking process
    let trackedManga = JSON.parse(fs.readFileSync(helper.TRACKED_MANGA_FILE_NAME).toString());
    for (let mangaName in trackedManga) {
        let needsUpdate = await mangaChapterListScraper.captureChapterLinks(mangaName, trackedManga, completedManga)
        updatedNeeded = (!updatedNeeded) ? needsUpdate : updatedNeeded;
    }
    // If there are manga that are currently being tracked that have been marked as Completed
    if (completedManga.length > 0) {
        // For every manga that has been marked as Completed remove from the tracked_manga object
        for (let mangaName of completedManga) {
            console.log(`${mangaName} is marked as ${helper.STATUS_COMPLETED}. Removing from ${helper.TRACKED_MANGA_FILE_NAME}`);
            delete trackedManga[mangaName];
        };
    }
    // Persist the new tracked_manga object for the next run
    fs.writeFileSync(helper.TRACKED_MANGA_FILE_NAME, JSON.stringify(trackedManga));
    console.log('Tracking File Updated');
    // Update the title_mapper
    console.log(`Building ${helper.TITLE_MAPPER_FILE_NAME}`);
    let titleMapper = {};
    for (let mangaName in trackedManga) {
        titleMapper[trackedManga[mangaName].urlKey] = mangaName;
    }
    // Persist to title_mapper.json file for next steps
    fs.writeFileSync(helper.TITLE_MAPPER_FILE_NAME, JSON.stringify(titleMapper));
    console.log('Title Mapper Updated');
    // Determine what the necessary next steps are...
    if (updatedNeeded && !sysArgs.has('-u')) { // Normal run, initiate the bulk_download process
        await bulkDownloader.initBulkDownload();
    } else if (sysArgs.has('-u')) { // User just wanted to update the tracked_manga file. Truncate urls.txt
        fs.writeFileSync(helper.URLS_FILE_NAME, '');
        console.log(`-u Update-Only Request Completed. Truncating ${helper.URLS_FILE_NAME}. manga_tracker exiting...`);
    } else { // No updates where needed, and user is all caught up with tracked_manga
        console.log('You\'re all caught up with your tracked manga, Congratulations!');
        console.log('No action required... manga_tracker exiting...');
    }
})();
