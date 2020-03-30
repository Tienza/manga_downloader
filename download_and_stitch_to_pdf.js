'use strict'

const pageScraper = require('./page_scraper');
const imgDownloader = require('./webpage_image_downloader');
const pdfWriter = require('./stitch_to_pdf');
const helper = require('./helper');

const sysArgs = process.argv;

if (typeof require != 'undefined' && require.main == module) {
    console.log('download_and_stitch_to_pdf running...');
    let url = sysArgs.filter((currVal) => helper.validURL(currVal))[0];
    let outputFileName = helper.fileNameFromKmURL(url);
    let imgSrcFileName = helper.imgSrcFileNameGenerator(outputFileName);
    pageScraper.getImageLinks(url, imgSrcFileName, () => imgDownloader.initDownloadAll(imgSrcFileName, () => pdfWriter.initStitchToPdf(imgSrcFileName, outputFileName)));
}
