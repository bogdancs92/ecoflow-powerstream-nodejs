
var path = require('path');
var express = require ('express');
var dotenv = require ('dotenv');
dotenv.config();
const port = 8000;
const key = "/?"+process.env.KEY_QUERY+"="
const app = express();

let mqttDaten = {};
app.get('/', (req, res) => {
  if (process.env.KEY_QUERY && req.query[process.env.KEY_QUERY]) {
    let v = req.query[process.env.KEY_QUERY];
    if (v*1==v && process.env.KEY_PASSWORD && process.env.KEY_MAIL && process.env.KEY_POWERSTREAM_SN) {
      //changeWatt(v*1, process.env.KEY_PASSWORD, process.env.KEY_MAIL, process.env.KEY_POWERSTREAM_SN);
      const {getEcoFlowMqttData, setupMQTTConnection, setAC, setPrio} = require(path.resolve( __dirname, "./ecoflow.js" ) );
      mqttDaten = getEcoFlowMqttData(process.env.KEY_MAIL, process.env.KEY_PASSWORD)
      .then(mqttDaten => {
        if (mqttDaten) {
          setupMQTTConnection(mqttDaten)
            .then (client => {
              client.on('connect', function () {
                console.log('Connecté au courtier Ecoflow MQTT');
                setAC(client, process.env.KEY_POWERSTREAM_SN,v*10);
                //setPrio(client, process.env.KEY_POWERSTREAM_SN,1);
                setTimeout(() => {
                  client.end();
                }, "3000");
                //isMqttConnected = true
            })
          })
          .catch();
        }
        res.send('Changed to ' + v);
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
});

app.use((req, res) => {res.status(404).send('Hello World!')});

app.listen(port, () =>
  console.log('Example app listening on port '+port+'!'),
);
