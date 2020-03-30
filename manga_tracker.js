'use strict'

const cloudscraper = require('cloudscraper');
const fs = require('fs');

const bulkDownloader = require('./bulk_manga_downloader');
const helper = require('./helper');

const sysArgs = new Set(process.argv);

const chapterLinkRegex = /\<td\>\s+\<a\shref\=\"(.*)\"\stitle\=\".*\"\>\s+.*\s+\<\/td\>/;
const kmPrefix = 'https://kissmanga.com';
const kmLinkPrefix = kmPrefix + '/Manga/'

const setDiff = (a, b) => {
    return a.filter(x => !b.has(x));
};

(async () => {
    console.log('Updating Tracker File && Writing New Downloads Links...');

    // If the ./urls.txt doesn't exit, then create it
    if (!fs.existsSync(helper.URLS_FILE_NAME)) {
        fs.writeFileSync(helper.URLS_FILE_NAME, '');
    }
    // If the tracked_manga.json doesn't exit, then create it
    if (!fs.existsSync(helper.TRACKED_MANGA_FILE_NAME)) {
        fs.writeFileSync(helper.TRACKED_MANGA_FILE_NAME, '{}');
    }

    let updatedNeeded = false;
    let trackedManga = JSON.parse(fs.readFileSync(helper.TRACKED_MANGA_FILE_NAME).toString());

    for (let manga in trackedManga) {
        let currManga = trackedManga[manga];
        await cloudscraper.get(kmLinkPrefix + manga).then((response) => {
            let totalChapters = response.match(new RegExp(chapterLinkRegex, 'g'))
                                        .map((currVal) => currVal.match(chapterLinkRegex)[1]);
            if (currManga.tracked.length !== totalChapters.length) {
                updatedNeeded = true;
                console.log(`${manga}: Missing ${totalChapters.length - currManga.tracked.length} Chapter(s)`);
                let missingChapterLinks = setDiff(totalChapters, new Set(currManga.tracked));
                currManga.tracked = totalChapters;
                fs.appendFileSync(helper.URLS_FILE_NAME, 
                    missingChapterLinks.map((currVal) => kmPrefix + currVal).join('\n') + '\n');
            } else {
                console.log(`${manga}: All Caught Up!`);
            }
        }, console.error);
    }
    
    fs.writeFileSync(helper.TRACKED_MANGA_FILE_NAME, JSON.stringify(trackedManga));
    console.log('Tracking File Updated');

    if (updatedNeeded && !sysArgs.has('-u')) {
        await bulkDownloader.initBulkDownload();
    } else if (sysArgs.has('-u')) {
        console.log('-u Update-Only Request Completed. manga_tracker exiting...');
    } else {
        console.log('You\'re all caught up with all your tracked manga, Congratulations!');
        console.log('No action required... manga_tracker exiting...');
    }
})();
