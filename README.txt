1. Open the page you want to download (i.e. https://kissmanga.com/Manga/Grand-Blue/Vol-001-Ch-001--Deep-Blue?id=304809)
    • Make sure your "Reading type" ===  "All pages". The script only downloads the images on the current page. (KissManga only)
2. Copy and paste the code inside "pre_script.js" into your browser's console (Recommended: Chrome)
3. Retrieve the downloaded img_sources.txt file and move it into the main download_and_stitch_to_pdf directory
4. Run the following command in a unix/linux terminal ./download_and_stitch_to_pdf.sh [-r|-k] <output file name>.pdf
    • Or call the .js file directly with the same arguments from your preferred terminal. Remember to invoke nodejs when calling the file
    • -r Enables forced rotation mode. All landscape images will be rotated into portrait mode (optimized for Kindle Readers)
    • -k Enables kindle optimization mode. All images that have lengths and widths that are too large for Kindle Paperwhite to scale properly
      will by scaled down to a manageable size, proportional to the size of the page.
    • Feel free to modify the .sh file to do additional actions. I personally added a mv command to move the downloaded img_sources.txt
      file into the same directory as ./download_and_stitch_to_pdf.sh
        • mv <file download directory>/img_sources.txt ./ && nodejs download_and_stitch_to_pdf.js "$@"