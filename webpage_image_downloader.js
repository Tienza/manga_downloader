'use strict'

const fs = require('fs');
const path = require('path');
const request = require('request');

const helper = require('./helper');

const tempDir = helper.TEMP_DIRECTORY_NAME;
const inputFileName = helper.DEFAULT_IMG_SRC;

let downloadFile = (uri, fileName, callback) => {
    request.head(uri, (err, res, body) => {
        if (err) { // If there is an error throw it and perform no action
            throw err;
        } else { // Send the request to download the image
            console.log('content-type:', res.headers['content-type']);
            console.log('content-length:', res.headers['content-length']);
            request(uri).pipe(fs.createWriteStream(fileName)).on('close', callback);
        }
    });
};

let downloadAll = (srcArr, imgSrcFileName = '', callback) => {
    // Variable to keep track of the number of images successfully downloaded
    let downloadedImgPaths = [];
    // If the ./temp/ directory doesn't exit, then create it
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir);
    }
    // Loop through all the image links found in the img_source.txt file, format the 
    // request url, and pass the file name
    for (let img in srcArr) {
        // Determine the number of 0's we need to use to keep the files in order
        let padNum = srcArr.length.toString().length;
        // Prepend the index of the image with the appropriate padding of 0's
        let imgNum = (img.toString().length < padNum) ? '0'.repeat(padNum - img.toString().length) + img : img;
        // Grab the img url
        let imgURL =  srcArr[img];
        // From the img url extract the extension
        let extension = path.extname(imgURL);
        // Finalize the image location and name
        let fileName = `${tempDir}/${imgSrcFileName}.${imgNum}${extension}`;
        // Initialize download of image
        downloadFile(imgURL, fileName, () => {
            console.log('Finished Downloading: ' + fileName);
            // Add file path to downloadedImgPaths after successful file download
            downloadedImgPaths.push(fileName);
            // Post download actions
            if (downloadedImgPaths.length === srcArr.length) {
                // Sort the downloaded file paths
                downloadedImgPaths = downloadedImgPaths.sort();
                // Overwrite imgSrcFile with file paths
                console.log(`Overwriting ${imgSrcFileName} with file paths...`);
                fs.writeFileSync(imgSrcFileName, downloadedImgPaths.join('\n'));
                // Invoke the callback function is not null
                if (callback) {
                    callback();
                }
            }
        });
    }
};

module.exports.initDownloadAll = (imgSrcFileName = inputFileName, callback = null) => {
    console.log('webpage_image_downloader running...');
    // Read img_sources.txt and put all the url(s) into an array
    let srcArr = fs.readFileSync(imgSrcFileName).toString().trim().split(/\r?\n/);
    if (srcArr.length > 0 && srcArr[0].trim() !== '') { // Only run if img_sources.txt is not empty
        downloadAll(srcArr, imgSrcFileName, callback);
    } else { // Exit the process with a failed status so that the next part doesn't run in the .sh file
        console.log('Empty img_sources.txt, Please enter valid img url(s) and try again');
        process.exit(1);
    }
};

if (typeof require != 'undefined' && require.main == module) {
    this.initDownloadAll();
}
