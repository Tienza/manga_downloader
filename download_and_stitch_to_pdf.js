'use strict'

const mangakakalotScraper = require('./mangakakalot_scraper');
const imgDownloader = require('./webpage_image_downloader');
const pdfWriter = require('./stitch_to_pdf');
const helper = require('./helper');

const sysArgs = process.argv;

if (typeof require != 'undefined' && require.main == module) {
    console.log('download_and_stitch_to_pdf running...');
    // Run through the arguments passed into see if there is a valid url - should only be at most 1
    let url = sysArgs.filter((currVal) => helper.validURL(currVal))[0];
    // From the URL passed in generate the output file name
    let outputFileName = helper.fileNameFromMkkURL(url);
    // Using the outputFileName generated, generate the img source file name
    let imgSrcFileName = helper.imgSrcFileNameGenerator(outputFileName);
    /* 
     * Using call back function to control execution flow
     * 1. Open url and retrieve all of img links sequentially. Store them in the img source file
     * 2. Initialize the download of all img(s) in the img source file and store in /temp
     * 3. Find all the relevant imgs in /temp and stitch into a PDF file named ${outputFileName}
    **/
   mangakakalotScraper.getImageLinks(url, imgSrcFileName, 
        () => imgDownloader.initDownloadAll(imgSrcFileName, 
            () => pdfWriter.initStitchToPdf(imgSrcFileName, outputFileName)));
}
