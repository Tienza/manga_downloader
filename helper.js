'use strict'

const imgFileSuffix = '.img_sources.txt';

module.exports.DEFAULT_IMG_SRC = './img_sources.txt';

module.exports.URLS_FILE_NAME = './urls.txt';

module.exports.TRACKED_MANGA_FILE_NAME = './tracked_manga.json';

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

module.exports.validURL = (str) => {
    let  pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
    '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
    '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
    '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
    return !!pattern.test(str);
};

module.exports.fileNameFromKmURL = (url) => {
    // This is assuming the link passed in is from KissManga - split the URL on /
    let urlSplit = url.split('/');
    // Grab the manga name
    let mangaName = urlSplit[urlSplit.length - 2];
    // Grab the chapter/title
    let chapter = urlSplit[urlSplit.length - 1].split('?')[0];
    // Append the manga name and chapter/title in pre-defined order and set extension to .pdf
    let suggestedTitle = `${mangaName} ${chapter}.pdf`.replace(/[\-\s+]+/g, ' ');
    suggestedTitle = suggestedTitle.replace(/\s+/g, '_');
    console.log(`Output file name generated from URL: '${suggestedTitle}'`);
    return suggestedTitle;
};

module.exports.imgSrcFileNameGenerator = (fileName) => {
    return fileName + imgFileSuffix;
}