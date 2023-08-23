# ecoflow-powerstream-nodejs
API to change the powestream outoput value

Based on work from https://forum.iobroker.net/topic/66743/ecoflow-connector-script-zur-dynamischen-leistungsanpassung

As I don't have an IOBroker I set up a node.js server to modify the output from the PowerStram by Ecoflow.

Not supported by Ecoflow, use it on your own rsponsability.

PowerStream
- setAc - modifies the output power
- setPrio - modifes the mode 0 = prio AC, 1 = prio storage

Call exemple (simply compose your correct URL and call it)
- SetPrio AC and watts to 100 :
https://YOUR_URL/cmd?TOKEN_KEY=TOKEN_VALUE&KEY1=100&KEY2=0

- SetPrio storage and watts to 500 :
https://YOUR_URL/cmd?TOKEN_KEY=TOKEN_VALUE&KEY1=500&KEY2=1

Home atomation usage:
- In configuration.xml:
  input_text:
  pws_out_value:
    name: Value for PowerStream Output
  pws_mode_value:
    name: Value for PowerStream Mode (0/1)
    
  rest_command:
    pws_cmd:
      url: "https://YOUR_URL/cmd?TOKEN_KEY=TOKEN_VALUE&KE1={{ states('input_text.pws_out_value') }}&KEY2={{ states('input_text.pws_mode_value') }}"
      verify_ssl: false


- automation script 1 - press buton set PWS to 120 without modifyng the mode
    alias: Btn PWS 120
    description: ""
    trigger:
      - platform: state
        entity_id:
          - input_button.btn_powserstream_120
    condition: []
    action:
      - service: input_text.set_value
        data:
          value: "120"
        target:
          entity_id: input_text.pws_out_value
      - service: rest_command.pws_cmd
        data: {}
    mode: single

automation script 2 - 20h30 set PWS 120 and mode to priority AC
  alias: Time 20h30 => PWS 120
  description: ""
  trigger:
    - platform: time
      at: "20:30:00"
  condition: []
  action:
    - service: automation.trigger
      data:
        skip_condition: true
      target:
        entity_id: automation.pws_100
    - device_id: f54d73723718d4b17d9ee13e36627877
      domain: mobile_app
      type: notify
      message: PWS => 120
    - delay:
        hours: 0
        minutes: 1
        seconds: 0
        milliseconds: 0
    - service: automation.trigger
      data:
        skip_condition: true
      target:
        entity_id: automation.pws_100
  mode: single

  



