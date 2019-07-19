'use strict'

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const sysArgs = process.argv;

const tempDir = './temp';
const outputDir = './output';

const forceRotation = (sysArgs[2] && sysArgs[2] === '-r') ? true : false;
const fileName = (forceRotation && sysArgs[3] && path.extname(sysArgs[3]) === '.pdf') ? sysArgs[3] : 
                 (!forceRotation && sysArgs[2] && path.extname(sysArgs[2]) === '.pdf') ? sysArgs[2] : 'output.pdf';
                 
const outputFilePath = outputDir + '/' + fileName;

let main = () => {
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
               let tempImg = temp.openImage(currentFile);
               // Create the output document - using size info from tempImg
               doc = new PDFDocument({
                  layout: 'portrait',
                  size: [tempImg.width, tempImg.height]
               });
               // Pipe output to pdf file
               doc.pipe(fs.createWriteStream(outputFilePath));
               console.log(`Created ${outputFilePath}`);
               // Append the first image
               doc.image(tempImg, 0, 0);
               console.log(`Added ${currentFile} to ${outputFilePath}`);
               if (forceRotation && tempImg.width > tempImg.height) {
                  console.log('Page rotated');
                  doc.page.dictionary.data.Rotate = 90;
                  // where 0 is the current page number.
                  doc._root.data.Pages.data.Kids[index] = doc.page.dictionary;
               }
               // Deallocate the first PDFDocument
               temp.end();
               // First pass is now complete
               firstPass = false;
            } else { // Append next image
               let img = doc.openImage(currentFile);
               doc.addPage({size: [img.width, img.height]}).image(img, 0, 0);
               console.log(`Added ${currentFile} to ${outputFilePath}`);
               if (forceRotation && img.width > img.height) {
                  console.log('Page rotated');
                  doc.page.dictionary.data.Rotate = 90;
                  // where 0 is the current page number.
                  doc._root.data.Pages.data.Kids[index] = doc.page.dictionary;
               }
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

console.log('stitch_to_pdf running...');
main();
