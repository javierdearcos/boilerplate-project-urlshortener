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
    res.status(400).json({ error: `Short URL ${shortURL} is invalid` });
    return;
  }

  urlRepository.findByShortURL(shortURL, (err, url) => {
    if (err) {
      res.status(500).json({ error: `Error looking for ${shortURL}: ${err}` });
      return;
    }

    if (!url) {
      res.status(404).json({ error: `Short URL ${shortURL} not found` });
      return;
    }

    res.redirect(url.original);
  });
});

app.post("/api/shorturl", (req, res) => {
  
  const originalURL = req.body.url;

  if (!originalURL) {
    res.status(400).json({ error: `Body is malformed: URL is required` });
    return;
  }

  const hostname = originalURL.replace(/https?:\/\//, "");

  dns.lookup(hostname, (err) => {
    if (err) {
      res.status(400).json({ error: "invalid url" });
      return;
    }

    urlRepository.findByOriginalURL(originalURL, (_, existingURL) => {
      if (existingURL) {
        res.status(200).json({
          original_url: originalURL,
          short_url: existingURL.short
        });
        return;
      }

      urlRepository.createAndSaveURL(originalURL, (err, url) => {
        if (err) {
          res.status(404).json({ error: `Can not create short url for ${originalURL}: ${err}` });
          return;
        }
  
        urlRepository.findById(url._id, (err, savedURL) => {
          if (err) {
            res.status(500).json({ error: `Error creating short url for ${originalURL}: ${err}` });
            return;
          }
  
          res.status(200).json({
            original_url: originalURL,
            short_url: url.short
          });
        });
      });
    });
  });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
