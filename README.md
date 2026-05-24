# Art Here

A community initiative that makes local creative communities visible and economically connected, city by city.

Art Here is a project of [Art Experience Lab](https://axlab.io).

## About this site

This is the Art Here pilot website, currently featuring Portland, Oregon. It is a static site (plain HTML, CSS, and JavaScript) with no build step required.

Launches planned for Biloxi, Mississippi and San Jose, California.

## Structure

```
index.html              Home page (logo window with sliding artwork)
styles.css              Shared styles
CNAME                   Custom domain config for GitHub Pages
pages/
  portland.html         Portland city page (artists, places, opportunities, network)
  network.html          Interactive network visualization
  about.html
  contact.html
artists/                Individual artist bio pages
images/                 All site imagery
```

## Running locally

Because the site uses separate files, open it through a local server rather than double-clicking `index.html` (some browsers block local file access for the CSS mask and images):

```bash
cd arthere
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Hosting

Published with GitHub Pages. The custom domain is set in `CNAME` and in the repository's Settings → Pages.
