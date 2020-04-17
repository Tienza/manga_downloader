'use strict'

const cp = require('child_process');
const fs = require('fs');

const helper = require('./helper');
const pageScraper = require('./page_scraper');

const sysArgs = new Set(process.argv);

let bulkDownloadErrorCleanUp = (errorDetected) => {
    if (!errorDetected) { // If no error was detected before set the errorDetected flag
        errorDetected = true;
        // Truncate and re-purpose urls.txt file and use it to store the failed urls
        console.log(`Error Detected: Truncating ${helper.URLS_FILE_NAME}...`);
        fs.writeFileSync(helper.URLS_FILE_NAME, '');
        console.log(`Re-purposing ${helper.URLS_FILE_NAME} to store failed URLs for retry`);
        fs.writeFileSync(helper.URLS_FILE_NAME, url + '\n');
    } else {
        // Append the failed urls
        fs.appendFileSync(helper.URLS_FILE_NAME, url + '\n');
    }
    return errorDetected;
};

let bulkDownload = () => {
    console.log('bulk_manga_downloader running...');
    // Read in all the manga URLs found in urls.txt and declare initial run variables
    let URLs = fs.readFileSync(helper.URLS_FILE_NAME).toString().trim().split(/\r?\n/);
    let processedURLs = [];
    let failedUrls = [];
    let errorDetected = false;
    // For each manga URL spawn a nodejs process to invoke download_and_stich_to_pdf
    console.log(`Launching ${URLs.length} download_and_stitch_to_pdf threads...`);
    for (let url of URLs) {
        let r = (sysArgs.has(helper.FORCE_ROTATION)) ? helper.FORCE_ROTATION : helper.NULL_ARG();
        let k = (sysArgs.has(helper.KINDLE_OPTIMIZED)) ? helper.KINDLE_OPTIMIZED : helper.NULL_ARG();
        let cmd = cp.spawn('nodejs', ['download_and_stitch_to_pdf.js', r, k, url]);
        // On stdout "data" callback print data to console
        cmd.stdout.on("data", (data) => {
            console.log(`Process ${cmd.pid} stdout: ${data}`);
        });
        // On stderr "data" callback print data to console
        cmd.stderr.on("data", (data) => {
            failedUrls.push(url); // Increment failedUrls for logging purposes
            errorDetected = bulkDownloadErrorCleanUp(errorDetected);
            console.log(`Process ${cmd.pid} stderr: ${data}`);
        });
        // On error callback print data to console
        cmd.on('error', (error) => {
            failedUrls.push(url); // Increment failedUrls for logging purposes
            errorDetected = bulkDownloadErrorCleanUp(errorDetected);
            console.log(`error: ${error.message}`);
        });

        cmd.on("close", code => {
            processedURLs.push(url); // Increment processedURLs to keep track of how many URLs we have left
            console.log(`Process ${cmd.pid} exited with code ${code}. (${processedURLs.length}/${URLs.length})`);
            // If all the urls have been processed and no errors were detected
            if (processedURLs.length + failedUrls.length >= URLs.length && !errorDetected) {
                // Truncate urls.txt and exit function
                console.log(`Truncating ${helper.URLS_FILE_NAME}...`);
                console.log('bulk_manga_downloader successfully executed! Enjoy reading your manga!');
                fs.writeFileSync(helper.URLS_FILE_NAME, '');
            } else if (processedURLs.length + failedUrls.length >= URLs.length && errorDetected) {
                // Recommend user look at the urls that failed and try running again
                console.log(`Errors were detected with the following URLs:\n ${failedUrls.join('\n')}`)
                console.log(`Failed URLs (${failedUrls.length}/${URLs.length}) stored in ${helper.URLS_FILE_NAME}, please try downloading again`);
            }
        });
    }
};

module.exports.initBulkDownload = async () => {
    await bulkDownload();
};

if (typeof require != 'undefined' && require.main == module) {
    (async () => {
        await pageScraper.checkAndUpdateKMVariables();
        await this.initBulkDownload();
    })();
}
