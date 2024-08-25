require('dotenv').config();
const express = require('express');
const cors = require('cors');
const dns = require('dns');
const mongoose = require('mongoose');
const { urlencoded } = require('body-parser');
const url = require('url');
const app = express();

// Basic Configuration
mongoose.connect(process.env.MONGO_URI,{ useNewUrlParser: true, useUnifiedTopology: true });

const urlSchema = mongoose.Schema({
  original_url: String,
  short_url: String
});

const urlModel = mongoose.model('urlModel', urlSchema);

const port = process.env.PORT || 3000;

app.use(cors());

app.use(urlencoded({extended: true}));

app.use('/public', express.static(`${process.cwd()}/public`));


app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});


//THIS IS BULLSHIT
app.get('/api/shorturl/:url', function(req,res){
  GetData({short_url: req.params.url}).then(receivedData=>{
    let [data] = receivedData;
    if(data) res.redirect(data.original_url);
    else res.json({ error: 'invalid url' });
  });
});

app.post('/api/shorturl/', function(req, res, next){
  dns.lookup(url.parse(req.body.url).hostname, function(err, address){
    if(!address) {
      res.json({ error: 'invalid url' });
      return;
    } else {
      next();
    }
  });
},function(req,res){
    GetData({original_url: req.body.url}).then(receivedData =>{
      let [data, index] = receivedData;

      if(data) {
        res.json({original_url: data.original_url, short_url: data.short_url});
      } 
      else {
        let newUrl = new urlModel({
          original_url: req.body.url,
          short_url: index
        });
        newUrl.save();
        res.json({original_url: newUrl.original_url, short_url: newUrl.short_url})
      }
    });
});

async function GetData(urlData){
  let data = await urlModel.findOne(urlData);
  let shortUrlIndex = await urlModel.countDocuments({});
  return [data, shortUrlIndex.toString()];
}

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
