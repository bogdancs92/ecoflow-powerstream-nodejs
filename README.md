# ecoflow-powerstream-nodejs
API to change the powestream outoput value

Based on work from https://forum.iobroker.net/topic/66743/ecoflow-connector-script-zur-dynamischen-leistungsanpassung

As I don't have an IOBroker I set up a node.js server to modify the output from the PowerStram by Ecoflow.

Not supported by Ecoflow, use it on your own rsponsability.

PowerStream
- setAc - modifies the output power
- setPrio - modifes the mode 0 = prio AC, 1 = prio storage
