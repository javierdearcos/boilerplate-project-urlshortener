require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser');
const dns = require('dns');
const urlRepository = require('./urlRepository');

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use(bodyParser.urlencoded({extended: false}));

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.get("/api/shorturl/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;

  if (!shortURL) {
    res.json({ error: `Short URL ${shortURL} is invalid` });
    return;
  }

  urlRepository.findByShortURL(shortURL, (err, url) => {
    if (err) {
      res.json({ error: `Error looking for ${shortURL}: ${err}` });
      return;
    }

    if (!url) {
      res.json({ error: `Short URL ${shortURL} not found` });
      return;
    }

    res.redirect(301, url.original);
  });
});

// https://javierdearcos-url-shortener.herokuapp.com/?v=1640204778513

app.post("/api/shorturl", (req, res) => {

  const originalURL = req.body.url;

  if (!originalURL) {
    res.json({ error: "invalid url" });
    return;
  }

  let url;

  try {
    url = new URL(req.body.url);
  } catch (error) {
    res.json({ error: `Body is malformed: URL is required` });
    return;
  }

  if (url.protocol != 'http:' && url.protocol != 'https:') {
    res.json({ error: "invalid url" });
    return;
  }

  dns.lookup(url.hostname, (err) => {
    if (err) {
      res.json({ error: "invalid url" });
      return;
    }

    urlRepository.findByOriginalURL(url.href, (_, existingURL) => {
      if (existingURL) {
        res.sjson({
          original_url: existingURL.original,
          short_url: existingURL.short
        });
        return;
      }

      urlRepository.createAndSaveURL(originalURL, (err, newURL) => {
        if (err) {
          res.json({ error: `Can not create short url for ${originalURL}: ${err}` });
          return;
        }

        res.json({
          original_url: newURL.original,
          short_url: newURL.short
        });
      });
    });
  });

});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
