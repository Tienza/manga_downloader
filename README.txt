1. Open the page you want to download (i.e. https://kissmanga.com/Manga/Grand-Blue/Vol-001-Ch-001--Deep-Blue?id=304809)
    • Make sure your "Reading type" ===  "All pages". The script only downloads the images on the current page. (KissManga only)
2. Copy and paste the code inside "pre_script.js" into your browser's console (Recommended: Chrome)
3. Retrieve the downloaded img_sources.txt file and move it into the same directory as "webpage_image_downloader.sh"
4. Run the following command in a unix/linux terminal ./webpage_image_downloader.sh [-r] <output file name>.pdf
    • -r Enables forced rotation mode. All landscape images will be rotated into portrait mode (optimized for Kindle Readers)
    • Feel free to modify the .sh file to do additional actions. I personally added a mv command to move the downloaded img_sources.txt
      file into the same directory as ./webpage_image_downloader.sh
        • mv <file download directory>/img_sources.txt ./ && nodejs webpage_image_downloader.js && nodejs stitch_to_pdf.js $1 $2