
var path = require('path');
var changeWatt = require(path.resolve( __dirname, "./main.js" ) );
var express = require ('express');
var dotenv = require ('dotenv');
dotenv.config();

const port = 8000;
const key = "/?"+process.env.KEY_QUERY+"="
const app = express();
app.get('/', (req, res) => {
  if (process.env.KEY_QUERY && req.url.includes(key)===true) {
    let v = req.url.replace(key,"");
    console.log(v);
    if (v*1==v && process.env.KEY_PASSWORD && process.env.KEY_MAIL && process.env.KEY_POWERSTREAM_SN) {
      changeWatt(v*1, process.env.KEY_PASSWORD, process.env.KEY_MAIL, process.env.KEY_POWERSTREAM_SN);
      res.send('Changed to ' + v);
    }
    else {
      res.send('Hello World!')
    }
  }
  else {
    res.send('Hello World!')
  }
});

app.listen(port, () =>
  console.log('Example app listening on port '+port+'!'),
);
