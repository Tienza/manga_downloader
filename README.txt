1. Open the KissManga page you want to download (i.e. https://kissmanga.com/Manga/Grand-Blue/Vol-001-Ch-001--Deep-Blue?id=304809)
2. Make sure your "Reading type" ===  "All pages". The script only downloads the images on the current page.
3. Copy and paste the code inside "pre_script.js" into your browser's console (Recommended: Chrome)
4. Retrieve the downloaded img_sources.txt file and move it into the same directory as "kiss_manga_downloader.sh"
5. Run the following command in a unix/linux terminal ./kiss_manga_downloader.sh [-r] <output file name>.pdf
    • -r Enables forced rotation mode. All landscape images will be rotated into portrait mode (optimized for Kindle Readers)