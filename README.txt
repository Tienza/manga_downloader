DOWNLOAD AND CONVERT ONE MANGA FROM URL

1. To download and convert individual Manga to PDF invoke the following command
  • nodejs download_and_stitch_to_pdf.js [-r|-k] <KissManga_link> (e.g. https://kissmanga.com/Manga/Grand-Blue/Vol-001-Ch-001--Deep-Blue?id=304809)
  • -r Enables forced rotation mode. All landscape images will be rotated into portrait mode (optimized for Kindle Readers)
  • -k Enables kindle optimization mode. All images that have lengths and widths that are too large for Kindle Paperwhite are scaled down to a manageable size, proportional to the size of the page.


TRACK MULTIPLE MANGA AND BULK DOWNLOAD

1. To track Manga from KissManga edit tracked_manga.json to include the Manga you want to track, in the following format. Optional attributes are denoted with "?" at the end.
  • {
    "tracked_manga_name": {
      "tracked": [],
      "limit?": int,
      "paused?": boolean
    },
    "Grand-Blue": {
      "tracked": [],
      "limit": 10,
      "paused": true
    },
    "Barakamon": {
      "tracked": [],
    }
  }
  • "tracked_manga_name" - The name of the as it appears in the KissManga URL (e.g. Grand-Blue)
  • "tracked" - Leave empty if you want to download all the currently available chapters. This is where the program will store all the manga chapter links it has previously seen in the past. Used for determining which chapters need to be downloaded
  • "limit" - Set a hard cap on how many chapters to download at a time if you don't want to download all the available chapters. If available chapters is less than the limit, all will be downloaded.
  • "paused": Boolean to determine whether to progress with the tracking of said manga or not. If it is true, the program will skip the manga.

2. Invoke the following command to begin the tracking and downloading process
  • nodejs manga_tracker.js [-r|-k|-u]
    • -r Please see above description
    • -k Please see above description
    • -u Update mode ONLY, with this option not downloads will occur, but the program will fetch and update tracked_manga.json with all the available chapter links (or up to limit if set)