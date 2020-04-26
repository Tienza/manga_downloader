'use strict'

const fs = require('fs');

module.exports.DEFAULT_IMG_SRC = './img_sources.txt';

module.exports.URLS_FILE_NAME = './urls.txt';

module.exports.TRACKED_MANGA_FILE_NAME = './tracked_manga.json';

module.exports.STATUS_ONGOING = 'Ongoing';

module.exports.STATUS_COMPLETED = 'Completed';

module.exports.FORCE_ROTATION = '-r';

module.exports.KINDLE_OPTIMIZED = '-k';

module.exports.KM_IV_FILE_NAME = './km_iv.txt';

module.exports.WRAP_KM_KEY_FILE_NAME = './wrap_km_key.txt';

module.exports.KM_IV = fs.readFileSync(this.KM_IV_FILE_NAME).toString(); // '\x61\x35\x65\x38\x65\x32\x65\x39\x63\x32\x37\x32\x31\x62\x65\x30\x61\x38\x34\x61\x64\x36\x36\x30\x63\x34\x37\x32\x63\x31\x66\x33';

module.exports.WRAP_KM_KEY = fs.readFileSync(this.WRAP_KM_KEY_FILE_NAME).toString(); // '\x6E\x73\x66\x64\x37\x33\x32\x6E\x73\x64\x6E\x64\x73\x38\x32\x33\x6E\x73\x64\x66';

module.exports.reloadIv = () => {
    this.KM_IV = fs.readFileSync(this.KM_IV_FILE_NAME).toString();
};

module.exports.NULL_ARG = () => {
    return (new Date()).getTime(); 
}
// Convert Hex Base String into ASCII
module.exports.hexToAscii = (hexStr) => {
    let hex = hexStr.toString();
    let str = '';
    for (let i = 0; (i < hex.length && hex.substr(i, 2) !== '00'); i += 2) {
        let hexChar = String.fromCharCode(parseInt(hex.substr(i, 2), 16));
        if (hexChar !== '\u0000') 
            str += hexChar;
    }
    return str;
};
// Determine if string passed in is a valid URL
module.exports.validURL = (str) => {
    let  pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
    '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
    '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
    '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
    return !!pattern.test(str);
};
// Generate file name using elements from the URL that was passed in - Assume KissManga Link
module.exports.fileNameFromKmURL = (url) => {
    // Split the URL on /
    let urlSplit = url.split('/');
    // Grab the manga name
    let mangaName = (urlSplit.length > 1) ? urlSplit[urlSplit.length - 2] : 'MangaName';
    // Grab the chapter/title
    let chapter = (urlSplit.length > 0) ? urlSplit[urlSplit.length - 1].split('?')[0] : '000';
    // Append the manga name and chapter/title in pre-defined order and set extension to .pdf
    let suggestedTitle = `${mangaName} ${chapter}.pdf`.replace(/[\-\s+]+/g, ' ');
    suggestedTitle = suggestedTitle.replace(/\s+/g, '_');
    console.log(`Output file name generated from URL: '${suggestedTitle}'`);
    return suggestedTitle;
};
// Append .img_sources.txt to denote image source file for in-progress manga
module.exports.imgSrcFileNameGenerator = (fileName) => {
    return fileName + '.img_sources.txt';
}