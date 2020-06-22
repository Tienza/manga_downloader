'use strict'

const fs = require('fs');
const puppeteer = require('puppeteer');

const helper = require('./helper');

const IMG_REGEX = /\<img\sonerror\=\"onErrorImg\(this\)\"\sonload\=\"onLoadImg\(this\)\;\"\ssrc\=\"(.+)\"\>\n\<\/p\>/;

//Remember to init your browser. Call this function at some point when your script starts up
let browser;

async function getPageBody(url, prom, options) {
    if (!prom) return;
    let waitTime = 300;
    let type;
    let gotoOptions = {}; //currently unused
    if (options) {
        if (options.waitTime && parseInt(options.waitTime)) 
            waitTime = parseInt(options.waitTime);
        if (options.type) 
            type = options.type;
        if (options.referer) 
            gotoOptions.referer = options.referer;
    }
    try {
        const page = await browser.newPage();
        await page.setRequestInterception(true);
        await page.setDefaultNavigationTimeout(60000);
        //disable image loading to make it faster
        page.on('request', (req) => {
            if (req.resourceType() === 'image') {
                req.abort();
            }
            else {
                req.continue();
            }
        })
        let gotoUrl = url;
        await page.goto(gotoUrl);
        await page.waitFor(waitTime);
        var bodyHandle = await page.$('body');
        var html = await page.evaluate(body => body.innerHTML, bodyHandle);
        if (type === "cloudflare" && html.indexOf(`<p data-translate="process_is_automatic">This process is automatic. Your browser will redirect to your requested content shortly.</p>`) !== -1) {
            console.log("Cloudflare detected - waiting");
            await page.waitFor(5200);
            bodyHandle = await page.$('body');
            html = await page.evaluate(body => body.innerHTML, bodyHandle);
        }
        if (gotoUrl.indexOf("kissmanga") !== -1 && html.indexOf(`<form action="/Special/AreYouHuman2" id="formVerify1" method="post">`) !== -1) {
            console.log("KM Captcha reload");
            await page.goto(gotoUrl); //go to the URL again, to go around the captcha
            await page.waitFor(500);
            bodyHandle = await page.$('body');
            html = await page.evaluate(body => body.innerHTML, bodyHandle);
        }
        await page.close();
        return prom(html);
    }
    catch (e) {
        console.log(e);
        return prom(null);
    }
}

async function initBrowser() {
    browser = await puppeteer.launch();
    await getKissMangaPage();
    await browser.close();
}

//Usage:
let getKMImageLinks = async (url, writeToFile = false, outputFileName = helper.DEFAULT_IMG_SRC, callback = null) => {
    // Initialize headless browser
    browser = await puppeteer.launch();
    // Declare a new promise to wait for
    let promise = new Promise((prom, reject) => getPageBody(url, prom, { type: "cloudflare" }));
    // Once promise is returned serve and assign to variable to further processing
    let pageHTML = await promise; //there you go
    if (pageHTML.indexOf('push(wrapKA') !== -1) {
        console.log("Manga page loaded successfully! Retrieving image links");
        let imgMatches = pageHTML.match(new RegExp(IMG_REGEX, 'g'));
        let imgLinks = imgMatches.map((currVal) => {
            let link = currVal.match(IMG_REGEX);
            if (link.length > 1) 
                return link[1];
        });
        console.log('Successfully retrieved image links');
        fs.writeFileSync(outputFileName, imgLinks.join('\n'));
        console.log(`${outputFileName} successfully written`);
        // Close browser after processing is completed
        await browser.close();
        // If there is a callback invoke it next
        if (callback) callback();
    } else {
        console.log("Returned HTML was not what we wanted. Printing the HTML in five seconds for debugging: ")
        setTimeout(() => { console.log(pageHTML) }, 5000);
    }
}

// Export function to be invoked when page_scraper is imported into another file
module.exports.getImageLinks = async (url, outputFileName = helper.DEFAULT_IMG_SRC, callback = null) => {
    console.log(`Retrieving image linkes from: ${url}`);
    getKMImageLinks(url, true, outputFileName, callback);
};
