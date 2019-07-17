'use strict'

const fs = require('fs');
const request = require('request');

const tempDir = './temp';

let download = (uri, filename, callback) => {
    request.head(uri, (err, res, body) => {
        if (err) { // If there is an error throw it and perform no action
            throw err;
        } else { // Send the request to download the image
            console.log('content-type:', res.headers['content-type']);
            console.log('content-length:', res.headers['content-length']);
            request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
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
        let padNum = srcArr.length.toString().length;
        let imgNum = (img.toString().length < padNum) ? '0'.repeat(padNum - img.toString().length) + img : img;
        let imgURL =  srcArr[img];
        let extension = imgURL.substring(imgURL.length - 4);
        let fileName = tempDir + '/' + imgNum + extension;
        download(imgURL, fileName, () => {
            console.log('Finished Downloading: ' + fileName);
        });
    }
};
let main = () => {
    let srcArr = fs.readFileSync('img_sources.txt').toString().trim().split(/\r?\n/);
    downloadAll(srcArr);
};

console.log('kiss_manga_downloader running...');
main();
