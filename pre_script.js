// pre-script defined inside a self calling anonymous arrow function to prevent 'already defined errors'
((console) => {
    // Define a function attribute called save on the global console object
    console.save = (data, fileName) => {
        if (!data) { // If no data is provided throw an error and stop processing
            console.error('Console.save: No data')
            return;
        } else { // Else proceed on with processing
            // Determine the file name, based on user input or default value
            fileName = (fileName && /^\w+\_\w+\.txt$/.test(fileName)) ? fileName : 'img_sources.txt';
            // If the data passed in is a JSON object then stringify it
            data = (typeof data !== "object") ? data : JSON.stringify(data, undefined, 4);
            // Declare Blob object and store the data that we want to write to a file
            let blob = new Blob([data], {type: 'text/json'});
            // Declare a MouseEvent variable to be used when downloading the file
            let e = document.createEvent('MouseEvents');
            // Declare an Anchor tag to store the file download information
            let a = document.createElement('a');
            // Set the Anchor download option as the file name
            a.download = fileName
            // Set the Anchor href as a new in-window URL
            a.href = window.URL.createObjectURL(blob);
            // Set the Anchor data set
            a.dataset.downloadurl = ['text/json', a.download, a.href].join(':');
            // Declare the type of mouse event to act upon the Anchor tag
            e.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
            // Dispatch and MouseEvent on the Anchor tag
            a.dispatchEvent(e);
        }
    }
    // Thank you Adam for these removal script - These are not necessary but will help ensure you only download
    // the images that you want if you are using this on KissManga.
    $('div#containerRoot>div').each(function (ind) {
        if ((ind) != 3) $(this).remove();
    });
    $('div#containerRoot>div>div[id!="divImage"]').remove();
    $('#containerRoot>div>p').remove();
    
    // Declare an empty string to store all the image url(s) that we detect on the page 
    let imgSrcs = '';
    // Run through each img tag on the page and grab their image url(s) and append to imgSrcs
    $('img').each(function () {  
        let imgSrc = this.src;
        imgSrcs += imgSrc + "\n";
    });
    // Print the list of sources for the user's benefit
    console.log(imgSrcs);
    // Write and save all the imgSrcs into a file called img_sources.txt
    console.save(imgSrcs, 'img_sources.txt');
})(console);
