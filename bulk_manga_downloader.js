'use strict'

const cp = require('child_process');
const fs = require('fs');

const helper = require('./helper');

let bulkDownload = () => {
    console.log('bulk_manga_downloader running...');
    let URLs = fs.readFileSync(helper.URLS_FILE_NAME).toString().trim().split(/\r?\n/);
    for (let url of URLs) {
        let ls = cp.spawn('nodejs', ['download_and_stitch_to_pdf.js', '-r', '-k', url]);

        ls.stdout.on("data", data => {
            console.log(`stdout: ${data}`);
        });

        ls.stderr.on("data", data => {
            console.log(`stderr: ${data}`);
        });

        ls.on('error', (error) => {
            console.log(`error: ${error.message}`);
        });

        ls.on("close", code => {
            console.log(`child process exited with code ${code}`);
        });
    }
}

module.exports.initBulkDownload = async () => {
    await bulkDownload();
    console.log(`Truncating ${helper.URLS_FILE_NAME}...`);
    fs.writeFileSync(helper.URLS_FILE_NAME, '');
};

if (typeof require != 'undefined' && require.main == module) {
    (async () => {
        await this.initBulkDownload();
    })();
}
