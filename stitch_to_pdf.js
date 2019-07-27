'use strict'

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const readLine = require('readline').createInterface({
   input: process.stdin,
   output: process.stdout
 });

const tempDir = './temp';
const outputDir = './output';

const rotateRatio = 90;

const kindlePaperWhiteMaxWidth = 1448;
const kindlePaperWhiteMaxHeight = 1072;

let checkAndRotate = (forceRotation, doc, index, imgWidth, imgHeight) => {
   if (forceRotation && imgWidth > imgHeight) {
      doc.page.dictionary.data.Rotate = rotateRatio;
      doc._root.data.Pages.data.Kids[index] = doc.page.dictionary;
      console.log('Page rotated');
   }
};

let checkAndScale = (kindleOptimized, pageWidth, pageHeight) => {
   if (kindleOptimized && pageWidth > kindlePaperWhiteMaxWidth && pageHeight > kindlePaperWhiteMaxHeight) {
      pageWidth = kindlePaperWhiteMaxWidth;
      pageHeight = kindlePaperWhiteMaxHeight;
      console.log('Image scaled down');
   }
   return {width: pageWidth, height: pageHeight};
}

let stitchToPdf = (forceRotation, kindleOptimized, fileName) => {
   let outputFilePath = outputDir + '/' + fileName;
   // If the ./temp/ directory doesn't exit, then create it
   if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
   }
   // If the ./output/ directory doesn't exit, then create it
   if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
   }
   fs.readdir(tempDir, (err, files) => {
      if (err) { // If there is an error throw it and perform no action
         throw err;
      } else { // Continue with output writing process
         // Create temporary PDFDocument to get size of first image
         let temp = new PDFDocument();
         // Place holder for real output file - First page set using size info from temp
         let doc = null;
         // Boolean for first pass setup
         let firstPass = true;
         // Write the downloaded images to the output pdf file
         files.forEach((file, index) => {
            let currentFile = tempDir + '/' + file;
            if (firstPass) { // Initialize output file setup
               // Open the first image
               let img = temp.openImage(currentFile);
               // Create the output document - using size info from tempImg - scale if too large
               let pageDimension = checkAndScale(kindleOptimized, img.width, img.height);
               let pageWidth = pageDimension.width;
               let pageHeight = pageDimension.height;
               doc = new PDFDocument({
                  layout: 'portrait',
                  size: [pageWidth, pageHeight]
               });
               // Pipe output to pdf file
               doc.pipe(fs.createWriteStream(outputFilePath));
               console.log(`Created ${outputFilePath}`);
               // Append the first image - scale the image if it is too large
               doc.image(img, 0, 0, {width: pageWidth, height: pageHeight});
               console.log(`Added ${currentFile} to ${outputFilePath}`);
               checkAndRotate(forceRotation, doc, index, img.width, img.height);
               // Deallocate the first PDFDocument
               temp.end();
               // First pass is now complete
               firstPass = false;
            } else { // Append next image
               let img = doc.openImage(currentFile);
               // Create the output document - using size info from tempImg - scale if too large
               let pageDimension = checkAndScale(kindleOptimized, img.width, img.height);
               let pageWidth = pageDimension.width;
               let pageHeight = pageDimension.height;
               // Append the first image - scale the image if it is too large
               doc.addPage({size: [pageWidth, pageHeight]}).image(img, 0, 0, {width: pageWidth, height: pageHeight});
               console.log(`Added ${currentFile} to ${outputFilePath}`);
               checkAndRotate(forceRotation, doc, index, img.width, img.height);
            }
            // Remove images after they have been written to the output pdf file 
            fs.unlink(currentFile, (err) => {
               if (err) {
                  throw err;
               }
            });
            console.log(`Removed file: ${currentFile}`);
         });
         // Finalize output pdf file
         doc.end();
         // Truncate img_source file
         fs.truncate('./img_sources.txt', 0, () => {
            console.log('Truncating img_source.txt');
            console.log(`Finalized and closed ${outputFilePath} ~ Memory deallocated ~`);
         });
      }
   });

};

module.exports.preOutputCheck = (forceRotation, kindleOptimized, fileName) => {
   console.log('stitch_to_pdf running...');
   let fileExists = fs.existsSync(outputDir + '/' + fileName);
   let invalidFileName = !/^[a-zA-Z0-9_]+.?p?d?f?$/.test(fileName);
   // Check if the output file the user specified already exists or if the file name provided is invalid
   if (fileExists || invalidFileName) {
      let prompt = (fileExists) ? 'Specified output file already exists, overwrite? (y/n): ' 
                                : 'The file name provided in invalid, rename? (y/n): ';
      readLine.setPrompt(prompt);
      readLine.prompt();
      readLine.on('line', (response) => {
         if (fileExists && response === 'n' || invalidFileName && response === 'y') { // Prompt user to rename file
            readLine.setPrompt('New output file name: ');
            readLine.prompt();
            readLine.on('line', (newFileName) => {
               // Add .pdf extension to file - if necessary
               newFileName = (path.extname(newFileName) === '.pdf') ? newFileName : newFileName + '.pdf';
               if (/^[a-zA-Z0-9_]+.?p?d?f?$/.test(newFileName) && !fs.existsSync(outputDir + '/' + newFileName)) { // If new file name is valid proceed on
                  // Set empty prompt and reprompt so there is not extra printed line of previous prompt
                  // Very Hacky Solution
                  readLine.setPrompt('');
                  readLine.prompt();
                  // Close User Input interface
                  readLine.close();
                  // Pass in new output file name and proceed
                  stitchToPdf(forceRotation, kindleOptimized, newFileName);
               } else { // Change prompt and give example of valid file name
                  readLine.setPrompt('Please enter a valid and/or currently nonexistent file name (ex. \'manga_name_53.pdf\'): ');
                  readLine.prompt();
               }
            });
         } else if (fileExists && response === 'y') { // If the user wants to overwrite, proceed without change
            // Close User Input interface
            readLine.close();
            console.log('Overwriting file');
            stitchToPdf(forceRotation, kindleOptimized, fileName);
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
      stitchToPdf(forceRotation, kindleOptimized, fileName);
      // Close User Input interface
      readLine.close();
   }
}
