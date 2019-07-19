'use strict'

const fs = require('fs');
const path = require('path');
const request = require('request');

const tempDir = './temp';

let download = (uri, fileName, callback) => {
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

let downloadAll = (srcArr) => {
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
        let fileName = tempDir + '/' + imgNum + extension;
        // Initialize download of image
        download(imgURL, fileName, () => {
            console.log('Finished Downloading: ' + fileName);
        });
    }
};
let main = () => {
    // Read img_sources.txt and put all the url(s) into an array
    let srcArr = fs.readFileSync('img_sources.txt').toString().trim().split(/\r?\n/);
    if (srcArr.length > 0) { // Only run if there are valid url(s) in img_sources.txt
        downloadAll(srcArr);
    } else { // Exit the process with a failed status so that the next part doesn't run in the .sh file
        console.log('Empty img_sources.txt, Please enter valid img url(s) and try again');
        process.exit(1);
    }
};

console.log('kiss_manga_downloader running...');
main();
