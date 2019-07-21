'use strict'

const fs = require('fs');
const path = require('path');
const request = require('request');
const pdfWriter = require('./stitch_to_pdf');

const sysArgs = process.argv;
const forceRotation = (sysArgs[2] && sysArgs[2] === '-r') ? true : false;

const tempDir = './temp';

// Retrieve the desired output file name from user input, otherwise assign default file name
let outputFileName = (forceRotation && sysArgs[3]) ? sysArgs[3] : (!forceRotation && sysArgs[2]) 
                        ? sysArgs[2] : 'output.pdf';
// Check if user provided file name is a valid pdf file type, otherwise append extension
outputFileName = (path.extname(outputFileName) === '.pdf') ? outputFileName : outputFileName + '.pdf';

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

let downloadAllAndStitchToPdf = (srcArr, forceRotation, outputFileName) => {
    let counter = 0;
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
            ++counter;
            if (counter === srcArr.length) {
                pdfWriter.main(forceRotation, outputFileName);
            }

        });
    }
};
let main = () => {
    console.log('kiss_manga_downloader running...');
    // Read img_sources.txt and put all the url(s) into an array
    let srcArr = fs.readFileSync('img_sources.txt').toString().trim().split(/\r?\n/);
    if (srcArr.length > 0) { // Only run if img_sources.txt is not empty
        downloadAllAndStitchToPdf(srcArr, forceRotation, outputFileName);
    } else { // Exit the process with a failed status so that the next part doesn't run in the .sh file
        console.log('Empty img_sources.txt, Please enter valid img url(s) and try again');
        process.exit(1);
    }
};

main();
