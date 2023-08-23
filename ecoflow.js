var https = require('https');
var protobuf=require("protobufjs");
var mqtt=require("mqtt");
const {log} = require("./utils");
const {protoSource2, musterSetAC, writeables} = require ("./const.js");

function httpsRequest(options, data) {
  return new Promise((resolve, reject) => {
      const req = https.request(options, res => {
          let data = '';
          res.on('data', chunk => {
              data += chunk;
          });
          res.on('end', () => {
              resolve(data);
          });
      });

      req.on('error', error => {
          console.log("error https ",error);
          reject(error);
      });

      if (data) {
          req.write(JSON.stringify(data));
      }

      req.end();
  });
}

async function getEcoFlowMqttData(email, password) {
  const options = {
      hostname: 'api.ecoflow.com',
      path: '/auth/login',
      method: 'POST',
      rejectUnauthorized: false,
      headers: {
          'Host': 'api.ecoflow.com',
          'lang': 'de-de',
          'platform': 'android',
          'sysversion': '11',
          'version': '4.1.2.02',
          'phonemodel': 'SM-X200',
          'content-type': 'application/json',
          'user-agent': 'okhttp/3.14.9'
      }
  };

  const mqttDaten = {};
  const data = {
      appVersion: "4.1.2.02",
      email: email,
      os: "android",
      osVersion: "30",
      password: Buffer.from(password).toString('base64'),
      scene: "IOT_APP",
      userType: "ECOFLOW"
  };

  function uuidv4() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
          var r = Math.random() * 16 | 0,
              v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
      });
  }

  let token, userid;
  try {
      let response =  await httpsRequest(options, data);
      let responseData = JSON.parse(response);
      token = responseData.data.token;
      userid = responseData.data.user.userId;
  } catch (error) {
      //throw new Error("Une erreur s'est produite:",error);
      console.log("ERROR",response);
      return null;
  }

  if (!token) return "ERROR";
  options.path = `/iot-auth/app/certification?userId=${userid}`;
  options.method = 'GET';
  options.headers.authorization = `Bearer ${token}`;
  try {
      let response = await httpsRequest(options);
      response = JSON.parse(response);
      mqttDaten.Passwort = response.data.certificatePassword;
      mqttDaten.Port = response.data.port;
      mqttDaten.UserID = userid;
      mqttDaten.User = response.data.certificateAccount;
      mqttDaten.URL = response.data.url
      mqttDaten.protocol = response.data.protocol;
      mqttDaten.clientID = "ANDROID_" + uuidv4() + "_" + userid
  } catch (error) {
      log("ERROR : Une erreur s'est produite lors de la détermination des données d'accès. Veuillez vérifier les données d'accès.", mqttDaten);
      return null;
      //throw new Error("Une erreur s'est produite lors de la détermination des données d'accès. Veuillez vérifier les données d'accès.");
  }
  return mqttDaten;
}

//################ MQTT Verbindung ##################
async function setupMQTTConnection(mqttDaten) {
  //console.log("mqttDaten",mqttDaten);
  //console.log("Nouvelle connexion MQTT : " + mqttDaten)
  // Verbindung herstellen
  const options = {
      port: mqttDaten.Port,
      clientId: mqttDaten.clientID,
      username: mqttDaten.User,
      password: mqttDaten.Passwort,
      protocol: mqttDaten.protocol,
      rejectUnauthorized: false,
  };
  const client = await mqtt.connect("mqtt://" + mqttDaten.URL, options);
  // Event-Handler für Verbindungsaufbau
  client.mqttDaten = mqttDaten;
  // Event-Handler für getrennte Verbindung
  client.on('close', () => {
      console.log("Le client MQTT est déconnecté");
      //isMqttConnected = false;
  });

  // Callback für Fehler
  client.on('error', function (error) {
      log('Fehler bei der Ecoflow MQTT-Verbindung:' + error, 'warn'); //
  });

  
  client.on('reconnect', function () {
      console.log('Reconnecting to Ecoflow MQTT broker...',mqttDaten.URL, mqttDaten.Port, mqttDaten.protocol); //
      // don't need to reconnect
      client.end();
  });
  
  // Weitere Event-Handler hier...
  return client;
}

function setAC(client,asn, Value) {
  log("set Ac => " + Value + " Watts");
  let updatedMusterSetAC = musterSetAC;
  if (Value <= -1) {
      delete updatedMusterSetAC.item.meta;
      delete updatedMusterSetAC.item.ValByte;
  }
  else {
      updatedMusterSetAC.header.pdata.value = Value
      updatedMusterSetAC.header.dataLen = getVarintByteSize(Value)
  }
  updatedMusterSetAC.header.seq = Date.now()
  updatedMusterSetAC.header.deviceSn = asn
  //log(JSON.stringify(updatedMusterSetAC))
  //setState(ConfigData.statesPrefix + '.app_' + mqttDaten.UserID + '_' + asn + '_thing_property_set.setAC', Value.toString(), true)
  SendProto(client,JSON.stringify(updatedMusterSetAC), '/app/' + client.mqttDaten.UserID + '/' + asn + '/thing/property/set');
}

//setStateNE(ConfigData.statesPrefix + '.app_' + mqttDaten.UserID + '_' + asn + '_thing_property_set.writeables.SetPrio', "1", false)
//{ id: 130, name: 'SetPrio', Typ: 'PS', Templet: 'setValue', Writable: true, ValueName: 'value', cmdFunc: 20 },               
function setPrio(_client, _asn, _value) {
    const lastPart =  "SetPrio";
    const matchedEntry = writeables.find((entry) => entry.name === lastPart); 
    //log(matchedEntry);
    if (matchedEntry) {
       if (matchedEntry.Typ == "PS") {
            updatedMuster = JSON.parse(JSON.stringify(musterSetAC));
            if (Number(_value) <= -1) {
                delete updatedMuster.item.meta;
                delete updatedMuster.item.ValByte;
            }
            else {
                updatedMuster.header.pdata[matchedEntry.ValueName] = Number(_value)
                updatedMuster.header.dataLen = getVarintByteSize(Number(_value))
            }
            updatedMuster.header.cmdId = matchedEntry.id
            updatedMuster.header.cmdFunc = matchedEntry.cmdFunc || 20
            updatedMuster.header.seq = Date.now()
            updatedMuster.header.deviceSn = _asn
            //log(JSON.stringify(updatedMuster))
            SendProto(_client, JSON.stringify(updatedMuster), '/app/' + _client.mqttDaten.UserID + '/' + _asn + '/thing/property/set');
        } 
    }
}

function SendProto(client, protomsg, topic) {
  //return
  const root = protobuf.parse(protoSource2).root;
  const PowerMessage = root.lookupType("setMessage");
  const message = PowerMessage.create(JSON.parse(protomsg));
  const messageBuffer = PowerMessage.encode(message).finish();
  //console.log("protomsg",protomsg);
  //console.log("message",message);

  //console.log("messageBuffer",messageBuffer.toString());
  //log("Modifizierter Hex-String:" +  Buffer.from(messageBuffer).toString("hex"));
  //log("topic:" +  topic);
  client.publish(topic, messageBuffer, { qos: 1 }, function (error) {
      if (error) {
          console.error('Fehler beim Veröffentlichen der MQTT-Nachricht:', error);
      } else {
          log('Le message MQTT a été publié avec succès.'); 
      }
  });
}

function getVarintByteSize(number) {
  let byteSize = 0;
  while (number >= 128) {
      byteSize++;
      number >>= 7; // Rechtsschiebeoperation um 7 Bits
  }
  byteSize++; byteSize++;
  return byteSize;
}

module.exports = {
  getEcoFlowMqttData,
  setupMQTTConnection,
  setAC,
  setPrio
}