import changeWatt from "./main.js";
import express from "express";
import dotenv from "dotenv";
dotenv.config();

const port = 8000;

const app = express();
app.get('/', (req, res) => {
  console.log(req.url);
  if (req.url.includes("/?changePowserStream=")===true) {
    let v = req.url.replace("/?changePowserStream=","");
    console.log(v);
    if (v*1==v && process.env.KEY_PASSWORD && process.env.KEY_MAIL && process.env.KEY_POWERSTREAM_SN) {
      changeWatt(v*1, process.env.KEY_PASSWORD, process.env.KEY_MAIL, process.env.KEY_POWERSTREAM_SN);
    }
    res.send('Changed to' + v);
  }
  else {
    res.send('Hello World!')
  }
});

app.listen(port, () =>
  console.log('Example app listening on port '+port+'!'),
);
