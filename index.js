require('dotenv').config();
const express = require('express');
const cors = require('cors');
const dns = require('dns');
const app = express();
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/url-save', {useNewUrlParser: true, useUnifiedTopology: true});
// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});
const urlSchema = new mongoose.Schema({
  originalUrl: String,
  shortUrl: String
});
const Url = mongoose.model('Url', urlSchema);

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});

app.get('/api/shorturl/:id', function(req, res) {
  const id = req.params.id;
  getUrl(id)
    .then(url => {
      if (url) {
        res.redirect(url.originalUrl);
      } else {
        res.json({ error: 'URL not found' });
      }
    })
    .catch(err => {
      res.json({ error: 'Error retrieving URL' });
    });
});
function save(originalUrl, shortUrl){
  const url = new Url({ originalUrl, shortUrl });
  return url.save();
}
function getUrl(shortUrl){
  return Url.findOne({ shortUrl });
}
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.post('/api/shorturl', function(req, res) {
    const url = req.body.url;
    const dnsTestClear = url.replace(/^(http:\/\/|https:\/\/)/, "").split('/')[0];
    if(!url){
      return res.json({ error: 'invalid url' });

    }
    if(dnsTestClear == "localhost:3000"){
      const short = Math.random() * 10000 + 1;
        save(url, short) //Hoping math.random will not f*** us
      .then(() => {
        return res.json({ "original_url": url, "short_url": short });
      })
    }else{
      dns.lookup(dnsTestClear, (err, address) => {
        if (err) {
          return res.json({ error: 'invalid url' });
        }else{
          const short = Math.random() * 10000 + 1;
          save(url, short) //Hoping math.random will not f*** us
        .then(() => {
          return res.json({ "original_url": url, "short_url": short });
        }).catch(err => {
          console.error(err);
          return res.status(500).json({ error: 'An error occurred while saving the URL' });
        });
        }
      });
    }
    
    
});