'use strict'

const imgDownloader = require('./webpage_image_downloader');
const pdfWriter = require('./stitch_to_pdf');

if (typeof require != 'undefined' && require.main == module) {
    console.log('download_and_stitch_to_pdf running...');
    imgDownloader.initDownloadAll(pdfWriter.initStitchToPdf)
}
