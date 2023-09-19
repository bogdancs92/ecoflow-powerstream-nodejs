
var path = require('path');
var express = require ('express');
var dotenv = require ('dotenv');
dotenv.config();
const port = 8000;
const key = "/?"+process.env.KEY_QUERY+"="
const app = express();
const url = process.env.KEY_URL;
const {log} = require("./utils");
let mqttDaten = {};

app.get('/'+url, (req, res) => {
  if (process.env.TOKEN && req.query[process.env.TOKEN] && (req.query[process.env.TOKEN] = process.env.TOKEN_VAL)) {
    let v = req.query[process.env.KEY_QUERY_AC];
    let v2 = req.query[process.env.KEY_QUERY_PRIO];
    if (process.env.KEY_PASSWORD && process.env.KEY_MAIL && process.env.KEY_POWERSTREAM_SN && ( v || v2)) {
      //changeWatt(v*1, process.env.KEY_PASSWORD, process.env.KEY_MAIL, process.env.KEY_POWERSTREAM_SN);
      if (req.query[process.env.KEY_QUERY_AC] || req.query[process.env.KEY_QUERY_PRIO]) {
        const {getEcoFlowMqttData, setupMQTTConnection, setAC, setPrio} = require(path.resolve( __dirname, "./ecoflow.js" ) );
        mqttDaten = getEcoFlowMqttData(process.env.KEY_MAIL, process.env.KEY_PASSWORD)
        .then(mqttDaten => {
          if (mqttDaten) {
            log('recevied datas from Ecoflow MQTT broker', mqttDaten)
            setupMQTTConnection(mqttDaten)
              .then (client => {
                client.on('connect', function () {
                  log('connected to Ecoflow MQTT broker')
                  //console.log('Connecté au courtier Ecoflow MQTT');
                  client.subscribe(['#'], () => {
                      log('Subscribe to Ecoflow MQTT topic #')
                  })
  
                  if (v && v*1>=0) {
                    setAC(client, process.env.KEY_POWERSTREAM_SN,v*10);
                  }
                  else {
                    log(process.env.KEY_QUERY_AC + ' must be grater than 0')
                  }
                  if (v2 && (v2*1===0 || v2*1===1)) {
                    setPrio(client, process.env.KEY_POWERSTREAM_SN,v2);
                  }
                  else {
                    log(process.env.KEY_POWERSTREAM_SN + ' must be 0 or 1')
                  }
                  setTimeout(() => {
                    log('disconnect to Ecoflow MQTT broker')                    
                    client.end();
                  }, "3000");
                  //isMqttConnected = true
              })
            })
            .catch();
          }
          else  {
            log('not connected to Ecoflow MQTT broker')
            res.send('not connected to Ecoflow MQTT broker');
          }

        })
        .catch();
      }
      else {
        log(process.env.KEY_QUERY_AC + ' or '  + process.env.KEY_QUERY_AC + ' are mandatory')
        res.send(process.env.KEY_QUERY_AC + ' or '  + process.env.KEY_QUERY_AC + ' are mandatory')
      }
    }
    else {
      log(process.env.KEY_PASSWORD + ' are mandatory')
      res.send(process.env.KEY_PASSWORD + ' are mandatory')
    }
  }
  else {
    log(process.env.TOKEN + ' are mandatory')
    res.send(process.env.TOKEN + ' are mandatory')
  }
});

app.use((req, res) => {res.status(404).send('Not found!')});

var server = app.listen(port, () => {
   var host = server.address().address;
   var port = server.address().port;
   
   log("Starting app listening at port " + port)
});
