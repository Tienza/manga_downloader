'use strict'

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const readLine = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
});
const helper = require('./helper');

const sysArgs = process.argv;
const validTitleRegEx = /^[a-zA-Z0-9_\s\(\)]+.?p?d?f?$/;

const tempDir = './temp';
const outputDir = './output';
const defaultFileName = 'output.pdf';

const rotateRatio = 90;

const kindlePaperWhiteLong = 1448;
const kindlePaperWhiteShort = 1072;

let checkAndGenerateSysArgs = (sysArgs, autoGenOutputFileName = null) => {
    // Initialize default values for the system arguments
    let forceRotation = false;
    let kindleOptimized = false;
    let outputFileName = (autoGenOutputFileName !== null) ? autoGenOutputFileName : defaultFileName;
    let titleSuggested = false;
    // Check to see if the following optional parameters were passed in
    forceRotation = (sysArgs.indexOf('-r') !== -1);
    kindleOptimized = (sysArgs.indexOf('-k') !== -1);
    // Find the specified file name - which should always be the final argument that is passed in
    if (outputFileName === defaultFileName 
        && sysArgs[sysArgs.length - 1] && validTitleRegEx.test(sysArgs[sysArgs.length - 1])) {
        outputFileName = sysArgs[sysArgs.length - 1];
    } else if (outputFileName === defaultFileName) {
        console.log(`Output file name defaulted to '${defaultFileName}'`);
    }
    return {
        forceRotation: forceRotation,
        kindleOptimized: kindleOptimized,
        outputFileName: outputFileName,
        titleSuggested: titleSuggested
    };
}

let checkAndRotate = (forceRotation, doc, index, imgWidth, imgHeight) => {
    // Rotate only if forceRotation is turned on and the width of the image is larger than the height
    if (forceRotation && imgWidth > imgHeight) {
        doc.page.dictionary.data.Rotate = rotateRatio;
        doc._root.data.Pages.data.Kids[index] = doc.page.dictionary;
        console.log('Page rotated');
    }
};

let checkAndScale = (kindleOptimized, pageWidth, pageHeight) => {
    // Scale down image if either the width or height of the image is larger Kindle Paper White Screen
    if (kindleOptimized && (pageWidth > kindlePaperWhiteLong || pageHeight > kindlePaperWhiteShort)) {
        // Determine the orientation of the file-to-be-scaled, and scale accordingly
        if (pageWidth > pageHeight) {    
            pageWidth = (pageWidth > kindlePaperWhiteLong) ? kindlePaperWhiteLong : pageWidth;
            pageHeight = (pageHeight > kindlePaperWhiteShort) ?  kindlePaperWhiteShort : pageHeight;
        } else {
            pageWidth = (pageWidth > kindlePaperWhiteShort) ? kindlePaperWhiteShort : pageWidth;
            pageHeight = (pageHeight > kindlePaperWhiteLong) ? kindlePaperWhiteLong : pageHeight;
        }
        console.log('Image scaled down');
    }
    return { width: pageWidth, height: pageHeight };
}

let stitchToPdf = (imgPathFileName = helper.DEFAULT_IMG_SRC, forceRotation, kindleOptimized, fileName) => {
    let outputFilePath = outputDir + '/' + fileName;
    // If the ./temp/ directory doesn't exit, then create it
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir);
    }
    // If the ./output/ directory doesn't exit, then create it
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
    }
    // List to store all the relevant image paths
    let imgPaths = [];
    // Create temporary PDFDocument to get size of first image
    let temp = new PDFDocument();
    // Place holder for real output file - First page set using size info from temp
    let doc = null;
    // Boolean for first pass setup
    let firstPass = true;
    
    if (imgPathFileName !== null) {
        let filePaths = fs.readFileSync(imgPathFileName).toString().trim().split(/\r?\n/);
        for (let index in filePaths) {
            imgPaths.push({fileName: filePaths[index], index: index});
        }
    } else {
        fs.readdir(tempDir, (err, files) => {
            if (err) { // If there is an error throw it and perform no action
                throw err;
            } else { // Continue with output writing process
                // Write the downloaded images to the output pdf file
                files.forEach((file, index) => {
                    imgPaths.push({fileName: tempDir + '/' + file, index: index});
                });
            }
        });
    }
    for (let currentFile of imgPaths) {
        try { // Try to stitch the file into pdf format
            if (firstPass) { // Initialize output file setup
                // Open the first image
                let img = temp.openImage(currentFile.fileName);
                // Create the output document - using size info from tempImg - scale if too large
                let pageDimension = checkAndScale(kindleOptimized, img.width, img.height);
                // Dimensions of the first page
                let pageWidth = pageDimension.width;
                let pageHeight = pageDimension.height;
                // Create the output document to start stitching together the manga
                doc = new PDFDocument({
                    layout: 'portrait',
                    size: [pageWidth, pageHeight]
                });
                // Pipe output to pdf file
                doc.pipe(fs.createWriteStream(outputFilePath));
                console.log(`Created ${outputFilePath}`);
                // Append the first image - scale the image if it is too large
                doc.image(img, 0, 0, { width: pageWidth, height: pageHeight });
                console.log(`Added ${currentFile.fileName} to ${outputFilePath}`);
                // Rotate the page if forcedRotation is turned on
                checkAndRotate(forceRotation, doc, currentFile.index, img.width, img.height);
                // Deallocate the first PDFDocument
                temp.end();
                // First pass is now complete
                firstPass = false;
            } else { // Append next image
                let img = doc.openImage(currentFile.fileName);
                // Create the output document - using size info from tempImg - scale if too large
                let pageDimension = checkAndScale(kindleOptimized, img.width, img.height);
                let pageWidth = pageDimension.width;
                let pageHeight = pageDimension.height;
                // Append the image - scale the image if it is too large
                doc.addPage({ size: [pageWidth, pageHeight] }).image(img, 0, 0, { width: pageWidth, height: pageHeight });
                console.log(`Added ${currentFile.fileName} to ${outputFilePath}`);
                // Rotate the page if forcedRotation is turned on
                checkAndRotate(forceRotation, doc, currentFile.index, img.width, img.height);
            }
        } catch (err) { // If processing fails, print the error and skip the file
            console.log(err);
            console.log('An error occurred during processing, skipping file');
        }
        // Remove images after they have been written to the output pdf file 
        fs.unlinkSync(currentFile.fileName);
        console.log(`Removed file: ${currentFile.fileName}`);    
    }
    // Finalize output pdf file
    doc.end();
    // Truncate img_source file
    fs.unlinkSync(imgPathFileName);
    console.log(`Deleting ${imgPathFileName}`);
    console.log(`Finalized and closed ${outputFilePath} ~ Memory deallocated ~`);
};

module.exports.initStitchToPdf = (imgPathFileName = null, autoGenOutputFileName = null) => {
    console.log('stitch_to_pdf running...');
    // Get the system arguments for this particular run of pdf creation
    let argsObj = checkAndGenerateSysArgs(sysArgs, autoGenOutputFileName);
    let forceRotation = argsObj.forceRotation;
    let kindleOptimized = argsObj.kindleOptimized;
    // Add file the file extension of .pdf to the end of the file if it was not originally provided
    let fileName = (path.extname(argsObj.outputFileName) === '.pdf') ? argsObj.outputFileName : argsObj.outputFileName + '.pdf';
    // Print out the parameters that will be passed into the function to begin stitching the pdf together
    console.log('Forced Rotation Mode: ' + forceRotation);
    console.log('Kindle Optimization Mode: ' + kindleOptimized);
    console.log('Output File Name: ' + fileName);
    // Perform pre-operation checks on the file name that was passed in
    let fileExists = fs.existsSync(outputDir + '/' + fileName);
    let invalidFileName = !validTitleRegEx.test(fileName);
    let defaultedFileName = (fileName === defaultFileName);
    // Check if the output file the user specified already exists or if the file name provided is invalid or if the name of the file was defaulted
    if (fileExists || invalidFileName || defaultedFileName) {
        let prompt = (fileExists) ? 'Specified output file already exists, overwrite? (y/n): '
            : (invalidFileName)
                ? 'The file name provided in invalid, rename? (y/n): '
                : 'The file name was defaulted, rename? (y/n): ';
        readLine.setPrompt(prompt);
        readLine.prompt();
        readLine.on('line', (response) => {
            if ((fileExists && response === 'n') || ((invalidFileName || defaultedFileName) && response === 'y')) { // Prompt user to rename file
                readLine.setPrompt('New output file name: ');
                readLine.prompt();
                readLine.on('line', (newFileName) => {
                    // Add .pdf extension to file - if necessary
                    newFileName = (path.extname(newFileName) === '.pdf') ? newFileName : newFileName + '.pdf';
                    if (validTitleRegEx.test(newFileName) && !fs.existsSync(outputDir + '/' + newFileName)) { // If new file name is valid proceed on
                        // Set empty prompt and reprompt so there is not extra printed line of previous prompt
                        // Very Hacky Solution
                        readLine.setPrompt('');
                        readLine.prompt();
                        // Close User Input interface
                        readLine.close();
                        // Pass in new output file name and proceed
                        stitchToPdf(imgPathFileName, forceRotation, kindleOptimized, newFileName);
                    } else { // Change prompt and give example of valid file name
                        readLine.setPrompt('Please enter a valid and/or currently nonexistent file name (ex. \'manga_name_53.pdf\'): ');
                        readLine.prompt();
                    }
                });
            } else if ((fileExists && response === 'y') || (defaultedFileName && response === 'n')) {
                // Close User Input interface
                readLine.close();
                console.log('Overwriting file');
                stitchToPdf(imgPathFileName, forceRotation, kindleOptimized, fileName);
            } else if (invalidFileName && response === 'n') {
                // Close User Input interface
                readLine.close();
                console.log('Oh no, look what you made me do. This is what you get...Deleting all downloaded images');
                // Delete all the downloaded image to spite the user :P
                fs.readdir(tempDir, (err, files) => {
                    if (err) {
                        throw err;
                    }
                    files.forEach((file) => {
                        fs.unlink(path.join(tempDir, file), (err) => {
                            if (err) {
                                throw err;
                            }
                        });
                    });
                    process.exit();
                });
                console.log('Well, nothing I can do now. Guess I\'ll just die...');
            } else { // If the user doesn't provide a valid response, reprompt
                readLine.prompt();
            }
        });
    } else { // If it doesn't and file name is valid then proceed without change
        stitchToPdf(imgPathFileName, forceRotation, kindleOptimized, fileName);
        // Close User Input interface
        readLine.close();
    }
}

if (typeof require != 'undefined' && require.main == module) {
    this.initStitchToPdf();
}
