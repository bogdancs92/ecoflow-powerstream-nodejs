
var path = require('path');
var express = require ('express');
var dotenv = require ('dotenv');
dotenv.config();
const port = 8000;
const key = "/?"+process.env.KEY_QUERY+"="
const app = express();

let mqttDaten = {};

app.get('/cmd', (req, res) => {
  if (process.env.TOKEN && req.query[process.env.TOKEN] && (req.query[process.env.TOKEN] = process.env.TOKEN_VAL)) {
    let v = req.query[process.env.KEY_QUERY_AC];
    let v2 = req.query[process.env.KEY_QUERY_PRIO];
    console.log(v,v2);
    if (process.env.KEY_PASSWORD && process.env.KEY_MAIL && process.env.KEY_POWERSTREAM_SN && ( v || v2)) {
      //changeWatt(v*1, process.env.KEY_PASSWORD, process.env.KEY_MAIL, process.env.KEY_POWERSTREAM_SN);
      if (req.query[process.env.KEY_QUERY_AC] || req.query[process.env.KEY_QUERY_PRIO]) {
        const {getEcoFlowMqttData, setupMQTTConnection, setAC, setPrio} = require(path.resolve( __dirname, "./ecoflow.js" ) );
        mqttDaten = getEcoFlowMqttData(process.env.KEY_MAIL, process.env.KEY_PASSWORD)
        .then(mqttDaten => {
          if (mqttDaten) {
            setupMQTTConnection(mqttDaten)
              .then (client => {
                client.on('connect', function () {
                  console.log('Connecté au courtier Ecoflow MQTT');
                  if (v) {
                    setAC(client, process.env.KEY_POWERSTREAM_SN,v*10);
                  }
                  if (v2 && (v2*1===0 || v2*1===1)) {
                    setPrio(client, process.env.KEY_POWERSTREAM_SN,v2);
                  }
                  //
                  //
                  setTimeout(() => {
                    client.end();
                  }, "3000");
                  //isMqttConnected = true
              })
            })
            .catch();
          }
          res.send('Hello World!');
        })
        .catch();
        }
      else {
        res.send('Hello World!')
      }
    }
    else {
      res.send('Hello World!')
    }
  }
  else {
    res.send('Hello World!')
  }
});

app.use((req, res) => {res.status(404).send('Hello World!')});

app.listen(port, () =>
  console.log('Example app listening on port '+port+'!'),
);
