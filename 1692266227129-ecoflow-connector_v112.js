/**
 * ecoflow-connector.js
 * Version:      1.1.2    
 * Release date: 17.08.2023
 * Autor:        Waly_de 
 * Forum:        https://forum.iobroker.net/topic/66743/ecoflow-connector-script-zur-dynamischen-leistungsanpassung
 * 
 * This JavaScript file establishes a simple connection between IOBroker and EcoFlow. 
 * It automatically creates known states under 0_userdata.
 * 
 * Please note that adjustments in the ConfigData section are required. Here, you need to enter your access credentials 
 * used for the EcoFlow app, as well as the serial numbers of your devices.
 * 
 * If you have a state that displays the current power consumption (SmartmeterID), please provide it as well. 
 * This value will be used to dynamically adjust the Powerstream's feed-in power.
 * 
 * Not all parameters of the Powerstream data are known yet. All known parameters will be automatically created as states.
 * By modifying the "protoSource" constant, newly discovered data will also be automatically created.
 * 
 * The raw data of the interface is logged as a HEX string.
 * 
 * Please exercise caution as this is the initial version of the script. Use it at your own risk!
 *
 * Requirements:
 * - Install protobuf. Simply add these libs to your javascript instance configuration (Zusätzliche NPM-Module)  
 * - The "Paho MQTT Client" is also required. If not already installed, use the javascript instance configuration.
 * 
 *
 * Note: It is encouraged to discover and publish missing data definitions to improve the script.
 * Suggestions, optimizations, and extensions are welcome at any time.
 *
 * Special thanks to all contributors for their valuable input and support.
 * 
 * Unterstütze das Projekt 'ecoflow-connector'
 * Wenn dir das Script zur dynamischen Leistungsanpassung für den IObroker gefällt und du es nützlich findest, 
 * ziehe bitte in Erwägung, eine kleine Spende via PayPal zu hinterlassen. 
 * Jeder Beitrag hilft, das Projekt am Laufen zu halten und weitere Updates zu ermöglichen. 
 * Danke für deine Unterstützung!
 * https://www.paypal.com/donate/?hosted_button_id=4J7JDDALF3N5L
 * 
 * 
 * Changelog:
 * -----------------------------------------------------------
 * (0.4) 29.06.2023
 * Da der MQTT von ecoflow regelmäßig aufhört zu senden, vor allem, wenn die App genutzt und komplett geschlossen wird, 
 * habe ich eine Überwachung der letzten ankommenden Nachrichten eingebaut. Kommt 5 Minuten lang nichts Neues vom PowerStream,
 * wird die Verbindung zum MQTT komplett neu aufgebaut.
 * 
 * Ein Fehler bei der Erstellung der States wurde beseitigt.
 * -----------------------------------------------------------
 * (0.5.2) 06.07.2023
 * State sumPV hinzugefügt (Summe aus PV1 und PV2) = Solar-Leistung gesamt.
 * Abweichung der PV Power von der App versucht zu kompensieren.
 * Neuen State RealPower zur besseren Ermittlung der Einspeiseleistung angelegt. Zeigt den Verbrauch im Haus ohne Einspeisung.
 * History für RealPower wird automatisch aktiviert.
 * Die Koordinaten werden aus den Systemeinstellungen ermittelt (sonst einfach selbst angeben).
 * Diverse kleine Anpassungen und Bugfixes.
 * Es werden jetzt mehrere PowerStreams berücksichtigt. In der Konfiguration muss das Flag "isPowerStream" gesetzt werden.
 * Gesteuert wird aber bisher nur der erste PowerStream.
 * Die protoSource so angepasst, dass in "Item" enthaltene unbekannte Daten auch als State angelegt werden. Bitte helft mit zu identifizieren,
 * was was ist. Dann können wir die Felder entsprechend benennen...
 * Parameter "subscribe" bei der Gerätekonfiguration hinzugefügt. Damit lässt sich der Empfang von MQTT Telegrammen für das Gerät abstellen.
 * Mein Delta Max hatte derart viel gesendet, dass der Raspi nicht mehr in der Lage war alles zu verarbeiten. Für die Steuerung braucht man die Daten der Batterie nicht.
 * Nach Sonnenuntergang wird jetzt weniger oft reconnectet, wenn keine Daten mehr kommen.
 * Reaktionszeiten für die Anpassung der Einspeisung wurden erhöht (30 Sekunden).
 * State "totalPV" für die derzeitige komplette PV Leistung hinzugefügt.
 * Funktion hinzugefügt, die die Einspeisung bei voller Batterie auf Maximum stellt. Ein- und Ausschaltprozent können mit battPozOn und battPozOff eingestellt werden.
 * -----------------------------------------------------------
 * (0.6.1) 26.07.2023
 * ACHTUNG: Die Felddefinitionen für den Powerstream sind jetzt vollständig und an die von der Community ermittelten Daten angepasst.
 * Das bedeutet aber leider auch, dass alle States mit neuen Namen neu angelegt werden. Die vom Script generierten States bleiben erhalten (SerAC, totalPV, sumPV).
 * 
 * Für die Delta Max sind nun einige States auch zum Schreiben verfügbar. Die Delta muss dazu nicht unbedingt auf "subscribe: true" gestellt werden.
 * Damit die States angelegt werden, müssen sie bei laufendem Script einmal in der App verändert werden. Möglich sind bisher:
 * Beep, slowChgPower, ACPower, DCPower, USBPower, minDsgSoc, maxChgSoc, curr12VMax, standByModeMins, lcdTimeMins, ACstandByMins, openOilSoc, closeOilSoc.
 * 
 * Ob diese States auch so bei anderen Deltas funktionieren, kann ich nicht sagen. Wenn nicht, solltet ihr im Log einen Eintrag finden: "Unbekannter Set Befehl:". 
 * Wenn ich diesen Eintrag mit einer kurzen Beschreibung erhalte, was es ist, kann ich es auch einbauen.
 * 
 * Die States werden hier angelegt: 0_userdata.0.ecoflow.app_XXXXXXXXXXXXXXXXXXX_XXXXXXXXXXXXXXX_thing_property_set.writeables
 * 
 * (0.6.7) 31.07.2023 * 
 * Writeables für Delta2 angelegt.
 * totalPV  / 10 geändert, damit ein echter Wattwert angezeigt wird. 
 * Anpassung für neues Datenformat nach diversen Updates von ecoflow.
 * Diverse Optimierungen und Bugfixes.
 *
 * (0.6.8) 03.08.2023 *  
 * Neue Einstellung: "Regulation: false" zum Abstellen der Regulierung des PowerStreams (Read Only Modus).
 * Anpassung an neues Format.
 * Bugfixes.
 * 
 * (1.0.0) 06.08.2023 *  
 * - Neuer State "lowestValue" zeigt die Grundlage zur Berechnung der Einspeiseleistung an und repräsentiert den niedrigsten Wert des realen Verbrauchs in den
 *   letzten mit "MinValueMin" eingestellten Minuten.
 * - Neue Einstellung MinValueAg: Art der Ermittlung des kleinsten Wertes 0 = Minimalwert, 1 = Durchschnittswert.
 * - Neues Feature: Wenn die volle Leistung (600w) in die Batterie geht, wird die Einspeiseleistung in Stufen erhöht, auch wenn dann 
 *   Leistung ins Netz geht, um möglichst das volle Potenzial der vorhandenen Solarenergie zu nutzen.
 * - Neue Einstellungen: lowBatLimitPozOn, lowBatLimitPozOff und lowBatLimit. Bei Unterschreiten der Batterieladung von "lowBatLimitPozOn" % ist die maximale Einspeiseleistung auf 
 *   "lowBatLimit" W limitiert, bis der Ladezustand wieder bei "lowBatLimitPozOff" ist.  
 * - Neue Einstellungen: RegulationState. Frei wählbar. Wenn angegeben, kann mit diesem State die Regulation ein- und ausgeschaltet werden (Wird automatisch unterhalb 0_userdata.0.ecoflow angelegt).
 * - Neue Einstellungen: RegulationOffPower. Wird die Regulation per State abgestellt, wird die Einspeiseleistung des ersten Powerstreams auf diesen Wert gesetzt. (-1 = keine Änderung).
 * 
 * (1.0.1) 07.08.2023 *  
 * - Writeables auch für PowerStreams angelegt (SetDisplayBrightness, SetPrio (0=Stromversorgung, 1= Batterie ), SetBatLimitLow, SetBatLimitHigh, SetAC).Sie tauchen auf, wenn bei laufendem Script per App geändert wird.
 * - Verbesserung der Reguierung 
 *   
 * (1.0.2) 09.08.2023 * 
 * - Unterstützung für SmartPlugs. Bisher ein Writeable: SwitchPlug mit den Werten 0= AUS und 1= AN
 * - Bugfix und Optimierungen
 * 
 * (1.1.2) 17.08.2023 * 
 * - Braking Changes bei der Konfiguration. Viele Daten sind jetzt zu den einzelnen PowerStream gewandert.
 * - Unterstützung der Steuerung von mehreren PowerStream in 2 Modes (Balance und Serial)
 *   Balance: die PS werden nacheinander angesprochen, dabei versucht jeder Einzelne für sich den Bedarf zu decken.
 *   Serial: Der Bedarf wird in der Reihenfolge der Konfiguration verteilt. Erst wenn der erste es nicht mehr schafft den Bedarf zu decken, wird der Nächste hinzugezogen
 * - Automatisches Wechseln in den Batterieprioritätsmodus. battOnSwitchPrio: true/false wenn battPozOn erreicht ist
 * - Festlegen des Gerätetyps bei der Konfiguration. Typ: Powerstrem:"PS"; DeltaMax:"DM"; DeltaMax2: "DM2"; SmartPlug: "SM"; Andere: "NA" 
 *  
 */
// Systemkoordinaten werden versucht zu ermitteln und als Default den Variablen zugeordnet.
var latitude;
var longitude;
// Ermitteln des Standortes aus den Einstellungen.
getStandortKoordinaten()

/***************************************
**********  YOUR DATA HERE  ************ 
****************************************/
var ConfigData = {
    email: "your@mail.com",                             // Die App-Zugangsdaten von ecoFlow
    passwort: "yourAppPasswort",
    seriennummern: [
        //############# Diesen Abschnitt für jedes einzelne Gerät anlegen ################
        {
            seriennummer: "XXXXXXXXXXXXX",              // Die Seriennummer des Gerätes
            name: "PowerStream",                        // beliebiger Namen
            subscribe: true,                            // "true": Alle Daten für dieses Gerät werden angefragt. "false": Es werden keine Statusdaten abgefragt
            typ: "PS",                                  // Welches Gerät ist es: Powerstrem:"PS"; DeltaMax:"DM"; DeltaMax2: "DM2"; SmartPlug: "SM"; Andere: "NA" 
            // Parameter an hier nur für PowerStream.     
            regulation: true,                           // "True": Dieser PowerStream soll vom Script reguliert werden
            hasBat: true,                               // "true": Eine Batterie ist angeschlossen. Nur für PowerStream relevant.
            battPozOn: 99, battPozOff: 92,              // Wenn die Batterie bei battPozOn ist, Einspeisung auf MaxPower. Bei BattPozOff Normalbetrieb
            battOnSwitchPrio: false,                    // Bei battPozOn wird in den Batterie-Prioritätsmodus gewechselt 
            lowBatLimitPozOn: 15, lowBatLimitPozOff: 25,// Bei Unterschreiten der Batterieladung von "lowBatLimitPozOn" % ist die maximale Einspeiseleistung auf 
            lowBatLimit: 150,                           // "lowBatLimit" limitiert, bis der Ladezustand wieder bei "lowBatLimitPozOff" ist
        },
        //#######################################################################
        {
            seriennummer: "XXXXXXXXXXXXX",
            name: "DELTA Max",
            typ: "DM",
            subscribe: false,                            // "true": Alle Daten für dieses Gerät werden angefragt. "false": Es werden keine Statusdaten abgefragt
        },
        //#######################################################################
        {
            seriennummer: "XXXXXXXXXXXXX",
            name: "SmartPlug 1",
            typ: "SM",
            subscribe: true,                            // "true": Alle Daten für dieses Gerät werden angefragt. "false": Es werden keine Statusdaten abgefragt
        },
        //#######################################################################
    ],
    SmartmeterID: "sonoff.0.Stromzaehler1.MT175_P",     // State, der den aktuellen Gesamtverbrauch in Watt anzeigt
    //****************************************
    // Erweiterte Einstellungen:
    //****************************************
    Regulation: true,                                   // 'false' stellt das Setzen der Einspeiseleistung ab 
    RegulationState: "",                                // Wenn angegeben, kann mit diesem State die Regulation ein- und ausgeschaltet werden (Wird automatisch unter 0_userdata.0.ecoflow angelegt)
    RegulationOffPower: -1,                             // Wird die Regulation per State abgestellt, wird die Einspeiseleistung des ersten Powerstreams auf diesen Wert gesetzt (-1 = keine Änderung)
    RegulationMultiPsMode: 0,                           // Wenn mehrere PS reguloert werden sollen. "balance" = 0 oder "serial" = 1
    BasePowerOffset: 30,                                // Wird vom aktuellen Verbrauch abgezogen, um die Einspeiseleistung zu berechnen 
    MaxPower: 600,                                      // Der höchstmögliche Wert in Watt für die Einspeiseleistung
    MinValueMin: 3,                                     // Der Zeitraum in Minuten, aus dem der niedrigste Gesamtverbrauchswert geholt werden soll 
    MinValueAg: 0,                                      // Art der Ermittlung des kleinsten Wertes: 0 = Minimalwert, 1 = Durchschnittswert
    ReconnectMin: 30,                                   // Zeit in Minuten, nach der die Anwendung neu gestartet wird, wenn keine neuen Daten eintreffen
    statesPrefix: "0_userdata.0.ecoflow",               // Hier werden die ecoFlow States angelegt
    latitude: latitude,                                 // Breitengrad des Standortes (wird automatisch eingesetzt)
    longitude: longitude,                               // Längengrad des Standortes (wird automatisch eingesetzt)
    Debug: false,
    PlotCmdID: 99999,
};
//***************************************/
//***************************************/

const LogAllHeader = false //"HW"  
const protoSource2 = `
syntax = "proto3";
message Message {
 repeated Header header = 1 ;
 bytes payload = 2;
}
message Header {
  bytes pdata = 1 [proto3_optional = false];
  int32 src = 2 [proto3_optional = true];
  int32 dest = 3 [proto3_optional = true];
  int32 d_src = 4 [proto3_optional = true];
  int32 d_dest = 5 [proto3_optional = true];
  int32 enc_type = 6 [proto3_optional = true];
  int32 check_type = 7 [proto3_optional = true];
  int32 cmd_func = 8 [proto3_optional = true];
  int32 cmd_id = 9 [proto3_optional = true];
  int32 data_len = 10 [proto3_optional = true];
  int32 need_ack = 11 [proto3_optional = true];
  int32 is_ack = 12 [proto3_optional = true];
  int32 seq = 14 [proto3_optional = true];
  int32 product_id = 15 [proto3_optional = true];
  int32 version = 16 [proto3_optional = true];
  int32 payload_ver = 17 [proto3_optional = true];
  int32 time_snap = 18 [proto3_optional = true];
  int32 is_rw_cmd = 19 [proto3_optional = true];
  int32 is_queue = 20 [proto3_optional = true];
  int32 ack_type = 21 [proto3_optional = true];
  string code = 22 [proto3_optional = true];
  string from = 23 [proto3_optional = true];
  string module_sn = 24 [proto3_optional = true];
  string device_sn = 25 [proto3_optional = true];
}
message InverterHeartbeat {
  optional uint32 inv_err_code = 1;
  optional uint32 inv_warn_code = 3;
  optional uint32 pv1_err_code = 2;
  optional uint32 pv1_warn_code = 4;
  optional uint32 pv2_err_code = 5;
  optional uint32 pv2_warning_code = 6;
  optional uint32 bat_err_code = 7;
  optional uint32 bat_warning_code = 8;
  optional uint32 llc_err_code = 9;
  optional uint32 llc_warning_code = 10;
  optional uint32 pv1_statue = 11;
  optional uint32 pv2_statue = 12;
  optional uint32 bat_statue = 13;
  optional uint32 llc_statue = 14;
  optional uint32 inv_statue = 15;
  optional int32 pv1_input_volt = 16;
  optional int32 pv1_op_volt = 17;
  optional int32 pv1_input_cur = 18;
  optional int32 pv1_input_watts = 19;
  optional int32 pv1_temp = 20;
  optional int32 pv2_input_volt = 21;
  optional int32 pv2_op_volt = 22;
  optional int32 pv2_input_cur = 23;
  optional int32 pv2_input_watts = 24;
  optional int32 pv2_temp = 25;
  optional int32 bat_input_volt = 26;
  optional int32 bat_op_volt = 27;
  optional int32 bat_input_cur = 28;
  optional int32 bat_input_watts = 29;
  optional int32 bat_temp = 30;
  optional uint32 bat_soc = 31;
  optional int32 llc_input_volt = 32;
  optional int32 llc_op_volt = 33;
  optional int32 llc_temp = 34;
  optional int32 inv_input_volt = 35;
  optional int32 inv_op_volt = 36;
  optional int32 inv_output_cur = 37;
  optional int32 inv_output_watts = 38;
  optional int32 inv_temp = 39;
  optional int32 inv_freq = 40;
  optional int32 inv_dc_cur = 41;
  optional int32 bp_type = 42;
  optional int32 inv_relay_status = 43;
  optional int32 pv1_relay_status = 44;
  optional int32 pv2_relay_status = 45;
  optional uint32 install_country = 46;
  optional uint32 install_town = 47;
  optional uint32 permanent_watts = 48;
  optional uint32 dynamic_watts = 49;
  optional uint32 supply_priority = 50;
  optional uint32 lower_limit = 51;
  optional uint32 upper_limit = 52;
  optional uint32 inv_on_off = 53;
  optional uint32 wireless_err_code = 54;
  optional uint32 wireless_warn_code = 55;
  optional uint32 inv_brightness = 56;
  optional uint32 heartbeat_frequency = 57;
  optional uint32 rated_power = 58;
}
message InverterHeartbeat2 {
   int32 X_Unknown_1 = 1;
   int32 X_Unknown_2 = 2;
   int32 X_Unknown_3 = 3;
   int32 X_Unknown_4 = 4;
   int32 X_Unknown_5 = 5;
   int32 X_Unknown_6 = 6;
   int32 X_Unknown_7 = 7;
   int32 X_Unknown_8 = 8;
   int32 X_Unknown_9 = 9;
   int32 X_Unknown_10 = 10;
   int32 X_Unknown_11 = 11;
   int32 X_Unknown_12 = 12;
   int32 X_Unknown_13 = 13;
   int32 X_Unknown_14 = 14;
   int32 X_Unknown_15 = 15;
   int32 X_Unknown_16 = 16;
   int32 X_Unknown_17 = 17;
   int32 X_Unknown_18 = 18;
   int32 X_Unknown_19 = 19;
   int32 X_Unknown_20 = 20;
   int32 X_Unknown_21 = 21;
   int32 X_Unknown_22 = 22;
   int32 X_Unknown_23 = 23;
   int32 X_Unknown_24 = 24;
   int32 X_Unknown_25 = 25;
   int32 X_Unknown_26 = 26;
   int32 X_Unknown_27 = 27;
   int32 X_Unknown_28 = 28;
   int32 X_Unknown_29 = 29;
   int32 X_Unknown_30 = 30;
   int32 X_Unknown_31 = 31;
   int32 X_Unknown_32 = 32;
   int32 X_Unknown_33 = 33;
   int32 X_Unknown_34 = 34;
   int32 X_Unknown_35 = 35;
   int32 X_Unknown_36 = 36;
   int32 X_Unknown_37 = 37;
   int32 X_Unknown_38 = 38;
   int32 X_Unknown_39 = 39;
   int32 X_Unknown_40 = 40;
   int32 X_Unknown_41 = 41;
   int32 X_Unknown_42 = 42;
   int32 X_Unknown_43 = 43;
   int32 X_Unknown_44 = 44;
   int32 X_Unknown_45 = 45;
   int32 X_Unknown_46 = 46;
   int32 X_Unknown_47 = 47;
   int32 X_Unknown_48 = 48;
   int32 X_Unknown_49 = 49;
   int32 X_Unknown_50 = 50;
   int32 X_Unknown_51 = 51;
   int32 X_Unknown_52 = 52;
}
message setMessage {
 setHeader header = 1;
}
message setHeader {
  setValue pdata = 1 [proto3_optional = true];
  int32 src = 2 [proto3_optional = true];
  int32 dest = 3 [proto3_optional = true];
  int32 d_src = 4 [proto3_optional = true];
  int32 d_dest = 5 [proto3_optional = true];
  int32 enc_type = 6 [proto3_optional = true];
  int32 check_type = 7 [proto3_optional = true];
  int32 cmd_func = 8 [proto3_optional = true];
  int32 cmd_id = 9 [proto3_optional = true];
  int32 data_len = 10 [proto3_optional = true];
  int32 need_ack = 11 [proto3_optional = true];
  int32 is_ack = 12 [proto3_optional = true];
  int32 seq = 14 [proto3_optional = true];
  int32 product_id = 15 [proto3_optional = true];
  int32 version = 16 [proto3_optional = true];
  int32 payload_ver = 17 [proto3_optional = true];
  int32 time_snap = 18 [proto3_optional = true];
  int32 is_rw_cmd = 19 [proto3_optional = true];
  int32 is_queue = 20 [proto3_optional = true];
  int32 ack_type = 21 [proto3_optional = true];
  string code = 22 [proto3_optional = true];
  string from = 23 [proto3_optional = true];
  string module_sn = 24 [proto3_optional = true];
  string device_sn = 25 [proto3_optional = true];
}
message setValue {
  optional int32 value = 1;
}
message permanent_watts_pack {
  optional int32 permanent_watts = 1;
}
message supply_priority_pack {
  optional int32 supply_priority = 1;
}
message bat_lower_pack {
  optional int32 lower_limit = 1;
}
message bat_upper_pack {
  optional int32 upper_limit = 1;
}
message PowerItem {
  optional uint32 timestamp = 1;
  optional sint32 timezone = 2;
  optional uint32 inv_to_grid_power = 3;
  optional uint32 inv_to_plug_power = 4;
  optional int32 battery_power = 5;
  optional uint32 pv1_output_power = 6;
  optional uint32 pv2_output_power = 7;
}
message PowerPack {
  optional uint32 sys_seq = 1;
  repeated PowerItem sys_power_stream = 2;
  //repeated plug_heartbeat_pack sys_power_stream = 2;
}
message PowerAckPack {
  optional uint32 sys_seq = 1;
}
message node_massage {
  optional string sn = 1;
  optional bytes mac = 2;
}
message mesh_child_node_info {
  optional uint32 topology_type = 1;
  optional uint32 mesh_protocol = 2;
  optional uint32 max_sub_device_num = 3;
  optional bytes parent_mac_id = 4;
  optional bytes mesh_id = 5;
  repeated node_massage sub_device_list = 6;
}
message EnergyItem {
  optional uint32 timestamp = 1;
  optional uint32 watth_type = 2;
  repeated uint32 watth = 3;
}
message EnergyTotalReport {
  optional uint32 watth_seq = 1;
  optional EnergyItem watth_item = 2;
}
message BatchEnergyTotalReport {
  optional uint32 watth_seq = 1;
  repeated EnergyItem watth_item = 2;
}
message EnergyTotalReportAck {
  optional uint32 result = 1;
  optional uint32 watth_seq = 2;
  optional uint32 watth_type = 3;
}
message EventRecordItem {
  optional uint32 timestamp = 1;
  optional uint32 sys_ms = 2;
  optional uint32 event_no = 3;
  repeated float event_detail = 4;
}
message EventRecordReport {
  optional uint32 event_ver = 1;
  optional uint32 event_seq = 2;
  repeated EventRecordItem event_item = 3;
}
message EventInfoReportAck {
  optional uint32 result = 1;
  optional uint32 event_seq = 2;
  optional uint32 event_item_num = 3;
}
message ProductNameSet {
  optional string name = 1;
}
message ProductNameSetAck {
  optional uint32 result = 1;
}
message ProductNameGet {}
message ProductNameGetAck {
  optional string name = 3;
}
message RTCTimeGet {}
message RTCTimeGetAck {
  optional uint32 timestamp = 1;
  optional int32 timezone = 2;
}
message RTCTimeSet {
  optional uint32 timestamp = 1;
  optional int32 timezone = 2 [(nanopb).default = 0];
}
message RTCTimeSetAck {
  optional uint32 result = 1;
}
message country_town_message {
  optional uint32 country = 1;
  optional uint32 town = 2;
}
message time_task_config {
  optional uint32 task_index = 1;
  optional time_range_strategy time_range = 2;
  optional uint32 type = 3;
}
message time_task_delet {
  optional uint32 task_index = 1;
}
message time_task_config_post {
  optional time_task_config task1 = 1;
  optional time_task_config task2 = 2;
  optional time_task_config task3 = 3;
  optional time_task_config task4 = 4;
  optional time_task_config task5 = 5;
  optional time_task_config task6 = 6;
  optional time_task_config task7 = 7;
  optional time_task_config task8 = 8;
  optional time_task_config task9 = 9;
  optional time_task_config task10 = 10;
  optional time_task_config task11 = 11;
}
message time_task_config_ack {
  optional uint32 task_info = 1;
}
message rtc_data {
  optional int32 week = 1 [(nanopb).default = 0];
  optional int32 sec = 2 [(nanopb).default = 0];
  optional int32 min = 3 [(nanopb).default = 0];
  optional int32 hour = 4 [(nanopb).default = 0];
  optional int32 day = 5 [(nanopb).default = 0];
  optional int32 month = 6 [(nanopb).default = 0];
  optional int32 year = 7 [(nanopb).default = 0];
}
message time_range_strategy {
  optional bool is_config = 1;
  optional bool is_enable = 2;
  optional int32 time_mode = 3;
  optional int32 time_data = 4;
  optional rtc_data start_time = 5;
  optional rtc_data stop_time = 6;
}
message plug_ack_message {
  optional uint32 ack = 1;
}
message plug_heartbeat_pack {
  optional uint32 err_code = 1 [(nanopb).default = 0];
  optional uint32 warn_code = 2 [(nanopb).default = 0];
  optional uint32 country = 3 [(nanopb).default = 0];
  optional uint32 town = 4 [(nanopb).default = 0];
  optional int32 max_cur = 5 [(nanopb).default = 0];
  optional int32 temp = 6 [(nanopb).default = 0];
  optional int32 freq = 7 [(nanopb).default = 0];
  optional int32 current = 8 [(nanopb).default = 0];
  optional int32 volt = 9 [(nanopb).default = 0];
  optional int32 watts = 10 [(nanopb).default = 0];
  optional bool switch = 11 [(nanopb).default = false];
  optional int32 brightness = 12 [(nanopb).default = 0];
  optional int32 max_watts = 13 [(nanopb).default = 0];
  optional int32 heartbeat_frequency = 14 [(nanopb).default = 0];
  optional int32 mesh_enable = 15 [(nanopb).default = 0];
}
message plug_switch_message {
  optional uint32 plug_switch = 1;
}
message brightness_pack {
  optional int32 brightness = 1 [(nanopb).default = 0];
}
message max_cur_pack {
  optional int32 max_cur = 1 [(nanopb).default = 0];
}
message max_watts_pack {
  optional int32 max_watts = 1 [(nanopb).default = 0];
}
message mesh_ctrl_pack {
  optional uint32 mesh_enable = 1 [(nanopb).default = 0];
}
message ret_pack {
  optional bool ret_sta = 1 [(nanopb).default = false];
}
enum CmdFunction {
    Unknown = 0;
    PermanentWattsPack = 129;
    SupplyPriorityPack = 130;
}
`;
const globalState = {};
const writeables = [
    { id: 38, name: 'Beep', ValueName: 'enabled', Typ: 'DM' },
    { id: 69, name: 'slowChgPower', ValueName: 'slowChgPower', Typ: 'DM' },
    { id: 66, name: 'ACPower', ValueName: 'enabled', Typ: 'DM' },
    { id: 81, name: 'DCPower', ValueName: 'enabled', Typ: 'DM' },
    { id: 34, name: 'USBPower', ValueName: 'enabled', Typ: 'DM' },
    { id: 51, name: 'minDsgSoc', ValueName: 'minDsgSoc', Typ: 'DM' },
    { id: 49, name: 'maxChgSoc', ValueName: 'maxChgSoc', Typ: 'DM' },
    { id: 71, name: 'curr12VMax', ValueName: 'currMa', Typ: 'DM' },
    { id: 33, name: 'standByModeMins', ValueName: 'standByMode', Typ: 'DM' },
    { id: 49, name: 'lcdTimeMins', ValueName: 'lcdTime', Typ: 'DM' },
    { id: 153, name: 'ACstandByMins', ValueName: 'standByMins', Typ: 'DM' },
    { id: 52, name: 'openOilSoc', ValueName: 'openOilSoc', Typ: 'DM' },
    { id: 53, name: 'closeOilSoc', ValueName: 'closeOilSoc', Typ: 'DM' },
    { id: 0, name: 'acChgCfg_D2', ValueName: 'chgWatts', Typ: 'D2', MT: 5, AddParam: '{"chgWatts":600,"chgPauseFlag":255}' },
    { id: 0, name: 'dcOutCfg_D2', ValueName: 'enabled', Typ: 'D2', MT: 1 },
    { id: 0, name: 'quietMode_D2', ValueName: 'enabled', Typ: 'D2', MT: 5 },
    { id: 0, name: 'dcChgCfg_D2', ValueName: 'dcChgCfg', Typ: 'D2', MT: 5 },
    { id: 1, name: 'InverterHeartbeat', Typ: 'PS', Templet: 'InverterHeartbeat', Writable: false, cmdFunc: 20 },
    { id: 1, name: 'plug_heartbeat_pack', Typ: 'PLUG', Templet: 'plug_heartbeat_pack', Writable: false, cmdFunc: 2 },
    { id: 4, name: 'InverterHeartbeat2', Typ: 'PS', Templet: 'InverterHeartbeat2', Writable: false, cmdFunc: 20 },
    { id: 11, name: 'Ping', Typ: 'PS', Templet: 'setValue', Writable: false, cmdFunc: 32 },
    { id: 32, name: 'Ignor', Typ: 'PS', Templet: '', Writable: false, Ignor: true, cmdFunc: 254 },
    { id: 134, name: 'Ignor', Typ: 'PS', Templet: '', Writable: false, Ignor: true, cmdFunc: 20 },
    { id: 135, name: 'SetDisplayBrightness', Typ: 'PS', Templet: 'setValue', Writable: true, ValueName: 'value', Ignor: false, cmdFunc: 20 },
    { id: 135, name: 'Ignor', Typ: 'Plug', Templet: '', Writable: false, ValueName: '', Ignor: true, cmdFunc: 2 },
    { id: 136, name: 'PowerPack', Typ: 'PS', Templet: 'PowerPack', Writable: false, cmdFunc: 20 },
    { id: 138, name: 'PowerPack', Typ: 'PS', Templet: 'PowerPack', Writable: false, cmdFunc: 20 },
    { id: 130, name: 'SetPrio', Typ: 'PS', Templet: 'setValue', Writable: true, ValueName: 'value', cmdFunc: 20 },
    { id: 132, name: 'SetBatLimitLow', Typ: 'PS', Templet: 'setValue', Writable: true, ValueName: 'value', cmdFunc: 20 },
    { id: 133, name: 'SetBatLimitHigh', Typ: 'PS', Templet: 'setValue', Writable: true, ValueName: 'value', cmdFunc: 20 },
    { id: 129, name: 'SetAC', Typ: 'PS', Templet: 'setValue', Writable: true, ValueName: 'value', cmdFunc: 20 },
    { id: 129, name: 'SwitchPlug', Typ: 'Plug', Templet: 'setValue', Writable: true, ValueName: 'value', cmdFunc: 2 },
];

const musterGetPS =
{
    "header": {
        "src": 32,
        "dest": 32,
        "seq": 1651831507,
        "OS": "ios"
    }
}

const musterSetAC = {
    header: {
        pdata: {
            value: 1300,
        },
        src: 32,
        dest: 53,
        dSrc: 1,
        dDest: 1,
        checkType: 3,
        cmdFunc: 20,
        cmdId: 129,
        dataLen: 3,
        needAck: 1,
        seq: 1651831507,
        version: 19,
        payloadVer: 1,
        from: 'ios',
        deviceSn: 'ABCxxxxxxx123'
    }
};

const musterSetAC2 = {
    header: {
        pdata: {
            value: 17477,
        },
        src: 32,
        dest: 53,
        dSrc: 1,
        dDest: 1,
        checkType: 3,
        cmdFunc: 32,
        cmdId: 11,
        dataLen: 4,
        needAck: 1,
        seq: 1651831507,
        version: 19,
        payloadVer: 1,
        from: 'ios',
        deviceSn: 'ABCxxxxxxx123'
    }
};

const musterslowChgPower = {
    "from": "iOS",
    "operateType": "TCP",
    "id": "816376009",
    "lang": "de-de",
    "params":
    {
        "id": 69,
    },
    "version": "1.0"
};

const musterDelta2 = {
    "from": "Android",
    "id": "458115693",
    "moduleType": 5,
    "operateType": "acChgCfg",
    "params":
    {
    }
    , "version": "1.0"
}


// @ts-ignore
const mqtt = require('mqtt');
const https = require('https');
// @ts-ignore
const protobuf = require("protobufjs");
// Verbindungsstatus speichern
let isMqttConnected = false;

const mqttDaten = {
    UserID: '',
    User: '',
    Passwort: '',
    URL: '',
    Port: '',
    protocol: '',
    clientID: ''
}

//Die erste PowerStream ermitteln 
let firstPsSn = ConfigData.seriennummern[0].seriennummer;
let firstPsSnIndex = -1
GetNextAsn()
//log("firstPsSn: " + GetNextAsn())
function GetNextAsn() {
    if (ConfigData.RegulationMultiPsMode == 1) {
        //return firstPsSn
        firstPsSnIndex = -1
    }
    var length = ConfigData.seriennummern.length;
    for (var j = 0; j < length; j++) {
        var i = (firstPsSnIndex + j + 1) % length;
        if (ConfigData.seriennummern[i].typ == "PS" && ConfigData.seriennummern[i].regulation) {
            firstPsSn = ConfigData.seriennummern[i].seriennummer;
            firstPsSnIndex = i
            break;
        }
    }
    //log("GetNextAsn:" + firstPsSn + " Index:" + firstPsSnIndex)
    return firstPsSn
}
/*=======================================================
  =========             Timer               ============
  =======================================================*/
//jede x Sekunden
var intervalID = setInterval(function () {
    if (true || istTag()) {
        CheckforReconnect(function () {
            SetBasePower(GetNextAsn());
        });
    } else {
        ////SetBasePower(firstPsSn);
    }
}, 15 * 1000);

// Hartbeat der App simmulieren
var intervalID3 = setInterval(function () {
    if (isMqttConnected) {
        for (var i = 0; i < ConfigData.seriennummern.length; i++) {
            if (ConfigData.seriennummern[i].typ == "PS") {
                setmusterGetPS(ConfigData.seriennummern[i].seriennummer);
            }
        }
    }
}, 32 * 1000);

/*
var intervalID2 = setInterval(function () {
    getLowestValue(ConfigData.statesPrefix + ".RealPower", 2)
        .then(lowestValue => {
            log( "lowestValue:" + lowestValue)//
        })
        .catch((error) => {
            console.warn('Fehler beim Abrufen des niedrigsten Werts:', error);
        });
}, 2 * 1000);
//*/



// @ts-ignore
await getEcoFlowMqttData(ConfigData.email, ConfigData.passwort)
async function getEcoFlowMqttData(email, password) {
    const options = {
        hostname: 'api.ecoflow.com',
        path: '/auth/login',
        method: 'POST',
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

    const data = {
        appVersion: "4.1.2.02",
        email: email,
        os: "android",
        osVersion: "30",
        password: Buffer.from(password).toString('base64'),
        scene: "IOT_APP",
        userType: "ECOFLOW"
    };

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
                reject(error);
            });

            if (data) {
                req.write(JSON.stringify(data));
            }

            req.end();
        });
    }

    function uuidv4() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0,
                v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    let response = await httpsRequest(options, data);
    try {
        let token = JSON.parse(response).data.token;
        let userid = JSON.parse(response).data.user.userId;
    } catch (error) {
        log(response) //
        throw new Error("Ein Fehler bei der Ermittlung der Zugangsdaten ist aufgetreten. Bitte prüfe die Zugangsdaten.");
    }

    let token = JSON.parse(response).data.token;
    let userid = JSON.parse(response).data.user.userId;

    options.path = `/iot-auth/app/certification?userId=${userid}`;
    options.method = 'GET';
    options.headers.authorization = `Bearer ${token}`;
    response = await httpsRequest(options);
    try {
        mqttDaten.Passwort = JSON.parse(response).data.certificatePassword
        mqttDaten.Port = JSON.parse(response).data.port
        mqttDaten.UserID = userid
        mqttDaten.User = JSON.parse(response).data.certificateAccount
        mqttDaten.URL = JSON.parse(response).data.url
        mqttDaten.protocol = JSON.parse(response).data.protocol
        mqttDaten.clientID = "ANDROID_" + uuidv4() + "_" + userid
    } catch (error) {
        log(response)//
        throw new Error("Ein Fehler bei der Ermittlung der Zugangsdaten ist aufgetreten. Bitte prüfe die Zugangsdaten.");
    }
    /*    
        log("UserID: " + userid); //
        log("User: " + JSON.parse(response).data.certificateAccount); //
        log("Passwort: " + JSON.parse(response).data.certificatePassword); //
        log("URL: " + JSON.parse(response).data.url); //
        log("Port: " + JSON.parse(response).data.port); //
        log("protocol: " + JSON.parse(response).data.protocol); //
        log("clientID: ANDROID_" + uuidv4() + "_" + userid); //
    */

}

// @ts-ignore
await createMyState("LastTopic")
//################ MQTT Verbindung ##################
function setupMQTTConnection() {
    //log("Neue MQTT Verbindung startet")
    // Verbindung herstellen
    const options = {
        port: mqttDaten.Port,
        clientId: mqttDaten.clientID,
        username: mqttDaten.User,
        password: mqttDaten.Passwort,
        protocol: mqttDaten.protocol
    };

    const client = mqtt.connect("mqtt://" + mqttDaten.URL, options);

    // Event-Handler für Verbindungsaufbau
    client.on('connect', function () {
        console.log('Verbunden mit dem Ecoflow MQTT-Broker')//
        SubscribeEco();
        for (var i = 0; i < ConfigData.seriennummern.length; i++) {
            if (ConfigData.seriennummern[i].typ == "PS") {
                setmusterGetPS(ConfigData.seriennummern[i].seriennummer);
            }
        }
        isMqttConnected = true

    });

    // Auf Nachricht empfangen Ereignis reagieren
    client.on('message', async function (topic, message) {
        //log("Incomming Massage: " + topic)
        //log("Incomming Massage: " + message.length)
        if (message.length == 0) return
        //return
        var jsonMessage = ""
        const mqState = topic.replace(/^\//, '').replace(/\//g, '_')
        //log(mqState)
        await createMyState(mqState + ".RAW")
        setState(ConfigData.statesPrefix + ".LastTopic", topic)
        try {
            jsonMessage = JSON.parse(message);
            if (false || ConfigData.Debug) log('JSON-Nachricht empfangen:' + topic + ':' + JSON.stringify(jsonMessage))  //
            if (!pruefeID(jsonMessage, mqState)) {
                return
            }
            setState(ConfigData.statesPrefix + '.' + mqState + ".RAW", JSON.stringify(jsonMessage))
            generateAndSyncSub("data", jsonMessage, false, ConfigData.statesPrefix + '.' + mqState)
        } catch (error) {
            if (error.name != "SyntaxError") log(error.stack, "warn") //
            //if (topic.indexOf("/set") !== -1) log('Binäre Nachricht empfangen:' + topic + ':' + message.toString('hex'));
            if (ConfigData.Debug) log('Binäre Nachricht empfangen:' + topic + ':' + message.toString('hex'));//
            await createMyState(mqState + ".RAW_HEX")
            setState(ConfigData.statesPrefix + '.' + mqState + ".RAW_HEX", message.toString('hex'))
            const messagedecoded = decodeAndPrint(message.toString('hex'), mqState)
            //log(messagedecoded)
            if (ConfigData.Debug) log('Decodierte Nachricht:' + messagedecoded) //
            setState(ConfigData.statesPrefix + '.' + mqState + ".RAW", messagedecoded)
            generateAndSyncSub("", JSON.parse(messagedecoded), false, ConfigData.statesPrefix + '.' + mqState)
        }
    });

    // Event-Handler für getrennte Verbindung
    client.on('close', () => {
        //console.log("MQTT-Client ist getrennt");
        isMqttConnected = false;
    });

    // Callback für Fehler
    client.on('error', function (error) {
        log('Fehler bei der Ecoflow MQTT-Verbindung:' + error, 'warn'); //
    });

    client.on('reconnect', function () {
        console.log('Reconnecting to Ecoflow MQTT broker...'); //
    });
    // Weitere Event-Handler hier...
    return client;
}

function SubscribeEco() {
    ConfigData.seriennummern.forEach(item => {
        client.subscribe('/app/' + mqttDaten.UserID + '/' + item.seriennummer + '/thing/property/set');
        client.subscribe('/app/' + mqttDaten.UserID + '/' + item.seriennummer + '/thing/property/get');
        if (item.subscribe) {
            client.subscribe('/app/device/property/' + item.seriennummer);
        }
    });
}

function findWriteableByID(id) {
    const foundItem = writeables.find((item) => item.id === id);
    return foundItem || null;
}
function findWriteableByValueName(id) {
    //log("suche nach writeable: " + id)
    const foundItem = writeables.find((item) => item.name === id);
    return foundItem || null;
}

//pruefeID(JSON.parse('{"params":{"slowChgWatts":300,"fastChgWatts":255,"chgPauseFlag":0},"from":"iOS","lang":"de-de","id":"25581985","modelSn":"RXXXXXXXXXXXXX","modelType":3,"operateType":"acChgCfg","version":"1.0"}'), 'app_1584583134200832001_HW51ZOH4SF541661_thing_property_set')
function pruefeID(json, mqState) {
    //log(mqState + " : " + JSON.stringify(json))
    if (mqState.includes("thing_property_set")) {
        if ('params' in json && 'id' in json.params) {        // ('params' in json && 'id' in json.params) (Delta Max)
            const Ignores = [40, 72, 68];
            const writeables = [69];
            if (Ignores.includes(json.params.id)) {
                //log("Ignore: "+ JSON.stringify(json))  
                return false;
            } else if (mqState.includes("thing_property_set")) {
                const suchwriteable = findWriteableByID(json.params.id)
                if (suchwriteable) {
                    //log("Schreibbar: " + JSON.stringify(json))
                    //log("Schreibbardaten: " + JSON.stringify(suchwriteable))
                    //log("wert: " + JSON.stringify(json.params[suchwriteable.ValueName]))
                    createMyState(mqState + ".writeables." + suchwriteable.name + "", json.params[suchwriteable.ValueName].toString())
                    setState(ConfigData.statesPrefix + "." + mqState + ".writeables." + suchwriteable.name, json.params[suchwriteable.ValueName].toString(), true)
                } else {
                    log("Unbekannter Set Befehl: " + JSON.stringify(json)) //
                    log("Adresse: " + mqState) //
                }
                return true;
            }
        } else if ('params' in json && 'moduleType' in json && 'operateType' in json) {           // Delta2
            let suchwriteable
            suchwriteable = findWriteableByValueName(json.operateType + "_D2")
            /*
            for (const paramName in json.params) {
                suchwriteable = findWriteableByValueName(paramName)
                if(suchwriteable) break
            }
            */
            if (suchwriteable) {
                //log("Schreibbar: " + JSON.stringify(json))
                //log("Schreibbardaten: " + JSON.stringify(suchwriteable))
                //log("wert: " + JSON.stringify(json.params[suchwriteable.ValueName]))
                createMyState(mqState + ".writeables." + suchwriteable.name, JSON.stringify(json.params[suchwriteable.ValueName].toString()))
                setState(ConfigData.statesPrefix + "." + mqState + ".writeables." + suchwriteable.name, JSON.stringify(json.params[suchwriteable.ValueName].toString()), true)
            } else {
                log("Unbekannter Delta2 Set Befehl: " + JSON.stringify(json)) //
                log("Adresse: " + mqState) //
            }
            return true;
        } else {   // ('params' in json && 'id' in json.params) (Delta Max)
            log("pruefeID: nix gefunden") //
            return true;
        }
    } //"thing_property_set"
    return true;
}


// Verbindung herstellen
let client = setupMQTTConnection();

// Funktion zum Trennen und Neuaufbau der Verbindung
function reconnect() {
    client.end(); // Verbindung trennen
    setTimeout(function () {
        client = setupMQTTConnection(); // Neue Verbindung herstellen
        //log("Ecoflow neuverbindung");
    }, 2000); // Wartezeit
}

// close connection if script stopped
onStop(function (callback) {
    if (client) {
        // close connection
        client.end();
        log("Ecoflow MQTT-Client beendet") //
        clearInterval(intervalID);
        //clearInterval(intervalID2);
        clearInterval(intervalID3);
    }
    callback();
}, 2000);

function CheckforReconnect(callback) {
    //log("CheckforReconnect")
    //return
    let wartezeit = 15
    //bis eine Stunde nach Sonneuntergang kurze Reconnects dann 15 min.
    if (istTag(60)) wartezeit = 1
    if (getState(ConfigData.statesPrefix + ".LastTopic")?.ts < Date.now() - ConfigData.ReconnectMin * 60 * 1000) {
        console.log("Der letzte Eintrag ist älter als " + ConfigData.ReconnectMin + " Minuten. Versuche Neustart."); //
        setState(ConfigData.statesPrefix + ".LastTopic", "Last Action Restart:" + new Date().toLocaleString())
        runScript();
        return;
        // Wenn letzte Powerstream-Meldung älter als <wartezeit> min ist, reconnecte 
    } else if (getState(ConfigData.statesPrefix + '.app_device_property_' + firstPsSn + '.RAW')?.ts < Date.now() - (wartezeit * 60 * 1000)) {
        //log("Reconnect zu Ecoflow MQTT für PowerStream - Daten")
        //.ts Updaten
        const oldvalue = getState(ConfigData.statesPrefix + '.app_device_property_' + firstPsSn + '.RAW').val
        setState(ConfigData.statesPrefix + '.app_device_property_' + firstPsSn + '.RAW', oldvalue)
        reconnect();
        return;
        //runScript();
    } else {
        callback();
    }
}


//const hextest = "0a0a1020182070f9f0b6830b"
function decodeAndPrint(hexString, mqState = "") {
    if (typeof hexString !== 'string' || !hexString) {
        log('Ungültiger hexString: "' + hexString + '"'); //
        return "{}";
    }
    const root = protobuf.parse(protoSource2).root;
    const PowerMessage = root.lookupType("Message");
    //const message = PowerMessage.decode(Buffer.from(hexString, "hex"));
    let message = {}
    try {
        message = PowerMessage.decode(Buffer.from(hexString, "hex"));
    } catch (error) {
        log('Fehler beim Decodieren:' + error.message); //
        //log('hexString: "' + hexString +'"');
        //log('buffer: ' + Buffer.from(hexString, "hex"))
        //log('PowerMessage: ' + PowerMessage)
        return "{}";
    }
    let logflag = false
    if (LogAllHeader) {
        // @ts-ignore
        for (let element of LogAllHeader.split(",")) {
            if (mqState.includes(element)) {
                //log("Ganze Nachricht :" + mqState + " : " + JSON.stringify(convconvertBuffersForLog(message)));
                logflag = true
            }
        }
    }
    let Rueckgabe = {}
    if (Array.isArray(message.header)) {
        //log("Nachricht Anzahl :" + message.header.length);
        let outputObject = {}
        for (let i = 0; i < message.header.length; i++) {
            const header = message.header[i];
            if (!header.cmdId) header.cmdId = 0; if (!header.cmdFunc) header.cmdFunc = 0
            let matchedEntry = writeables.find((entry) => entry.id == header.cmdId && entry.cmdFunc == header.cmdFunc) || { id: header.cmdId, name: 'nichtDefiniert', Typ: 'PS', Templet: 'nichtDefiniert', Writable: false, Ignor: false };
            if (matchedEntry.Templet == "nichtDefiniert") {
                //matchedEntry = writeables.find((entry) => entry.id == header.cmdId && entry.Typ == "PS") || { id: header.cmdId, name: 'nichtDefiniert', Typ: 'PS', Templet: 'nichtDefiniert', Writable: false, Ignor: false };
            }
            //log(JSON.stringify(matchedEntry))
            const MessageType = matchedEntry.Templet
            //const MessageType = messageIDTypes[header.cmdId] || "nichtDefiniert"
            //log("MessageType: " + MessageType)
            if (logflag && header.cmdId > -1) log("Serial:" + header.deviceSn + " cmdId:" + header.cmdId + " cmdFunc:" + header.cmdFunc + " Pdata Hex: " + header.pdata.toString('hex')) //
            if (logflag && (header.cmdId) == (ConfigData.PlotCmdID)) {
                log("--------------------------------------------")//
                log("topic: " + mqState)//
                log("Definition: " + JSON.stringify(matchedEntry))//
                log("cmdId: " + header.cmdId)//
                log("RAW: " + hexString)//
                log("Nachricht: " + JSON.stringify(convconvertBuffersForLog(message)))//
                log("Header: " + i + " von(" + message.header.length + ") " + JSON.stringify(convconvertBuffersForLog(header)))//
                //log("Pdata Hex: " + header.pdata.toString('hex'))
                log("--------------------------------------------")//
            }
            if (matchedEntry.Ignor) {
                //log("Ignor: " + JSON.stringify(matchedEntry))
                //log(hexString)
                //log(JSON.stringify(convconvertBuffersForLog(message)))
                continue;
            }
            if (MessageType == "nichtDefiniert") {
                if (header.cmdId != 0 && header.cmdId) {
                    console.warn('Nicht definierter cmd_func-Wert:' + header.cmdId + " cmdFunc:" + header.cmdFunc);
                    log("hexString: " + hexString)//
                }
                continue;
            } else {
                const PdataMessage = root.lookupType(MessageType);
                const pdata = PdataMessage.decode(header.pdata);
                const pdataObject = PdataMessage.toObject(pdata, {
                    longs: Number, // Konvertiere Long-Werte in Zahlen (optional)
                    enums: String, // Konvertiere Enum-Werte in Strings (optional)
                    bytes: Buffer, // Konvertiere Bytes in Buffer (optional)
                });
                outputObject[MessageType] = pdataObject
                if (matchedEntry.Writable && mqState.includes("thing_property_set")) {
                    //log("Wert = " + JSON.stringify(outputObject) + " topic:"+ mqState)
                    const setvalue = pdataObject[matchedEntry.ValueName] || 0
                    setStateNE(ConfigData.statesPrefix + "." + mqState + ".writeables." + matchedEntry.name, setvalue.toString(), true)
                }

                if (logflag && header.cmdId == ConfigData.PlotCmdID) {
                    log("outputObject: " + JSON.stringify(convconvertBuffersForLog(outputObject))) //
                    log("--------------------------------------------") //
                }

                Rueckgabe.data = outputObject;
                continue;
            }
        };
    } else {
        // Das Ergebnis ist eine einzelne Message
        log("Es wurde eine einzelne Message dekodiert:" + JSON.stringify(convconvertBuffersForLog(message))); //
        return JSON.stringify(Rueckgabe);
    }
    //log("DURCHLAUF:" + JSON.stringify(Rueckgabe))
    return JSON.stringify(Rueckgabe)
}

function convconvertBuffersForLog(obj, hash = new WeakMap()) {    //
    if (obj == null || typeof obj !== 'object') return obj;
    //if (Buffer.isBuffer(obj)) return Buffer.from(obj); //Original Buffer
    if (Buffer.isBuffer(obj)) return obj.toString('hex'); //Hexstring
    if (hash.has(obj)) return hash.get(obj);
    let copy = Array.isArray(obj) ? [] : {};
    hash.set(obj, copy);
    for (let key in obj) {
        if (obj.hasOwnProperty(key)) {
            copy[key] = convconvertBuffersForLog(obj[key], hash); //
        }
    }
    return copy;
}

function convertBuffersToHexStrings(obj) {
    for (let key in obj) {
        //if (key == "pdata") log("pdata gefunden. typ: " + typeof obj[key]) 
        if (obj[key] instanceof Buffer) {
            obj[key] = obj[key].toString('hex');
        } else if (typeof obj[key] === 'object') {
            convertBuffersToHexStrings(obj[key]);
        }
    }
}

function SendProto(protomsg, topic) {
    //return
    const root = protobuf.parse(protoSource2).root;
    const PowerMessage = root.lookupType("setMessage");
    const message = PowerMessage.create(JSON.parse(protomsg));
    const messageBuffer = PowerMessage.encode(message).finish();
    //log("Modifizierter Hex-String:" +  Buffer.from(messageBuffer).toString("hex"));
    //log("topic:" +  topic);
    client.publish(topic, messageBuffer, { qos: 1 }, function (error) {
        if (error) {
            console.error('Fehler beim Veröffentlichen der MQTT-Nachricht:', error);
        } else {
            if (ConfigData.Debug) log('Die MQTT-Nachricht wurde erfolgreich veröffentlicht.'); //
        }
    });
}

function SendJSON(protomsg, topic) {
    //log("topic:" +  topic);
    client.publish(topic, protomsg, { qos: 1 }, function (error) {
        if (error) {
            console.error('Fehler beim Veröffentlichen der MQTT-Nachricht:', error);
        } else {
            if (ConfigData.Debug) log('Die MQTT-Nachricht wurde erfolgreich veröffentlicht.'); //
        }
    });
}

function getStandortKoordinaten() {
    var obj = getObject('system.config');
    if (obj) {
        latitude = obj.common.latitude;
        longitude = obj.common.longitude;
    } else {
        console.error('Fehler beim Abrufen der Einstellungen');
    }
}

//Anmeldenachrichten der APP
function setmusterGetPS(asn) {
    let updatedMusterSetAC = JSON.parse(JSON.stringify(musterGetPS));
    updatedMusterSetAC.header.seq = Date.now()
    //log(JSON.stringify(updatedMusterSetAC));
    SendProto(JSON.stringify(updatedMusterSetAC), '/app/' + mqttDaten.UserID + '/' + asn + '/thing/property/get');
    SendProto(JSON.stringify(updatedMusterSetAC), '/app/' + mqttDaten.UserID + '/' + asn + '/thing/property/get');
    SendProto(JSON.stringify(updatedMusterSetAC), '/app/' + mqttDaten.UserID + '/' + asn + '/thing/property/get');
    // @ts-ignore
    updatedMusterSetAC = JSON.parse(JSON.stringify(musterSetAC2));
    updatedMusterSetAC.header.seq = Date.now()
    updatedMusterSetAC.header.deviceSn = asn
    //log(JSON.stringify(updatedMusterSetAC));
    SendProto(JSON.stringify(updatedMusterSetAC), '/app/' + mqttDaten.UserID + '/' + asn + '/thing/property/set');
}

function generateAndSyncSub(id, JElements, sub = false, preset = "0_userdata.0") {
    if (!JElements || typeof JElements !== 'object') {
        log('Ungültige JElements übergeben!'); //
        return;
    }
    for (var JElement in JElements) {
        var AktVal;
        if (typeof JElements[JElement] === "object") {
            if (id === "") {
                generateAndSyncSub(JElement, JElements[JElement], true, preset);
            } else {
                generateAndSyncSub(id + "." + JElement, JElements[JElement], true, preset);
            }

            //generateAndSyncSub(id + "." + JElement, JElements[JElement], true, preset);
        } else {
            try {
                if (isState2(preset + "." + id + "." + JElement)) AktVal = getState(preset + "." + id + "." + JElement).val; else AktVal = null
            } catch (e) {
                log("Fehler: " + e); //
            }
            if (AktVal == null) {
                createState(preset + "." + id + "." + JElement, JElements[JElement], false);
                AktVal = JElements[JElement];
            }
            if (AktVal != JElements[JElement]) {
                if (isState2(preset + "." + id + "." + JElement)) {
                    setState(preset + "." + id + "." + JElement, JElements[JElement]);
                }
            }
        }
    }
}


/* Checks if a a given state or part of state is existing.
* This is a workaround, as getObject() or getState() throw warnings in the log.
* Set strict to true if the state shall match exactly. If it is false, it will add a wildcard * to the end.
* See: https://forum.iobroker.net/topic/11354/
* @param {string}    strStatePath     Input string of state, like 'javascript.0.switches.Osram.Bedroom'
* @param {boolean}   [strict=false]   Optional: if true, it will work strict, if false, it will add a wildcard * to the end of the string
* @return {boolean}                   true if state exists, false if not */
function isState2(strStatePath, strict = true) {
    let mSelector;
    if (strict) {
        mSelector = $(strStatePath);
    } else {
        mSelector = $(strStatePath + "*");
    }
    if (mSelector.length > 0) {
        return true;
    } else {
        return false;
    }
}

//--------- Prüft übergebne zeiträume und Tage und gibt True zurück wenn innerhalb 
//log("return: " + CheckTime2("22:00","11:00",[0,1,2,3,4,5,6],getDateObject("06 Nov 2018 08:30:00 GMT+0100"))); 
function CheckTime2(Startzeit, Endzeit, Wochentage, d = new Date()) {
    var locStartDate = getDateObject(formatDate(d, "MM DD YYYY " + Startzeit));
    var locEndDate = getDateObject(formatDate(d, "MM DD YYYY " + Endzeit));
    var LocOriginal = getDateObject(formatDate(d, "MM DD YYYY hh:mm:ss"));
    Wochentage = Wochentage.map(function (x) {
        return parseInt(x, 10);
    });
    if (locStartDate.getTime() > locEndDate.getTime()) {
        if (LocOriginal.getTime() >= locStartDate.getTime() && LocOriginal.getTime() <= getDateObject(formatDate(d, "MM DD YYYY 23:59:59")).getTime()) {
            d.setDate(d.getDate() + 1);
            locEndDate = getDateObject(formatDate(d, "MM DD YYYY " + Endzeit));
        } else {
            d.setDate(d.getDate() - 1);
            locStartDate = getDateObject(formatDate(d, "MM DD YYYY " + Startzeit));
        }
    }
    var n = getDateObject(locStartDate).getDay();
    if (Wochentage.includes(n) && LocOriginal.getTime() >= getDateObject(locStartDate).getTime() && LocOriginal.getTime() <= getDateObject(locEndDate).getTime()) { return true } else { return false }
}

function SunTimes(time = 0) {
    // @ts-ignore
    const SunCalc = require('suncalc');
    const date = new Date();
    // Berechnung von Sonnenaufgang und Sonnenuntergang
    const sunTimes = SunCalc.getTimes(date, ConfigData.latitude, ConfigData.longitude);
    const sunrise = sunTimes.sunrise.getHours() + ':' + sunTimes.sunrise.getMinutes();
    const sunset = sunTimes.sunset.getHours() + ':' + sunTimes.sunset.getMinutes();
    if (time == 0) {
        return sunrise
    } else {
        return sunset
    }
}

function istTag(offsetMin = 0) {
    //log("Ist Tag?: " + CheckTime2(SunTimes(0).toString(), addMinutesToTime(SunTimes(1).toString(),offsetMin), [0, 1, 2, 3, 4, 5, 6], new Date()));
    return CheckTime2(SunTimes(0).toString(), addMinutesToTime(SunTimes(1).toString(), offsetMin), [0, 1, 2, 3, 4, 5, 6])
}

function addMinutesToTime(time, minutesToAdd) {
    var parts = time.split(":");
    var hours = parseInt(parts[0]);
    var minutes = parseInt(parts[1]);
    var totalMinutes = hours * 60 + minutes + minutesToAdd;
    var newHours = Math.floor(totalMinutes / 60) % 24;
    var newMinutes = totalMinutes % 60;
    var newTime = newHours.toString().padStart(2, "0") + ":" + newMinutes.toString().padStart(2, "0");
    return newTime;
}
//############ Funktionen zum Setzen von Werten
for (var i = 0; i < ConfigData.seriennummern.length; i++) {
    if (ConfigData.seriennummern[i].typ == "PS") {
        const asn = ConfigData.seriennummern[i].seriennummer
        //log(asn)
        // @ts-ignore
        await createMyState('app_' + mqttDaten.UserID + '_' + asn + '_thing_property_set.setAC')
        on({ id: ConfigData.statesPrefix + '.app_' + mqttDaten.UserID + '_' + asn + '_thing_property_set.setAC', change: "any", ack: false }, function (obj) {
            setAC(asn, Number(obj.state.val))
            setState(obj.id, obj.state.val, true);
        });

        //Powersumme bilden und schreiben data.InverterHeartbeat.pv1InputWatts
        on({ id: new RegExp(ConfigData.statesPrefix + '.app_device_property_' + asn + '.data.InverterHeartbeat.pv.InputWatts'), change: "any" }, function (obj) {
            let state1 = ConfigData.statesPrefix + '.app_device_property_' + asn + '.data.InverterHeartbeat.pv1InputWatts';
            let state2 = ConfigData.statesPrefix + '.app_device_property_' + asn + '.data.InverterHeartbeat.pv2InputWatts';
            //let korstate = ConfigData.statesPrefix + '.app_device_property_' + asn + '.data.InverterHeartbeat.X_Unknown_5';
            let sumState = ConfigData.statesPrefix + '.app_device_property_' + asn + '.data.InverterHeartbeat.sumPV';

            if (existsState(state1) || existsState(state2)) {
                let pv1InputWatts = 0, pv2InputWatts = 0
                if (existsState(state1)) pv1InputWatts = GetValAkt(state1, 30).val
                if (existsState(state2)) pv2InputWatts = GetValAkt(state2, 30).val
                //let sum = GetValAkt(state1, 30).val  + GetValAkt(state2, 30).val  - (getState(korstate).val * 20);
                let sum = (pv1InputWatts + pv2InputWatts) * (0.93);
                if (!existsState(sumState)) {
                    createState(sumState, sum);
                } else {
                    setState(sumState, sum);
                    //log("Summe gesetzt für "+asn+": "+ sum)
                }
            }
        });
    }
}
const idRegex = new RegExp(ConfigData.statesPrefix + '\.app_[A-Za-z0-9_]+_thing_property_set\\.writeables\\..*');
on({ id: idRegex, change: "any", ack: false }, function (obj) {
    const idParts = obj.id.split('.');
    const lastPart = idParts[idParts.length - 1];
    const matchedEntry = writeables.find((entry) => entry.name === lastPart);
    //const matchedEntry = writeables.find((entry) => entry.name === lastPart && entry.typ === "PS");
    if (matchedEntry) {
        //log("Write Event: " + obj.id + " val: " + obj.state.val + " | Matched Entry: " + JSON.stringify(matchedEntry));
        const asn = obj.id.match(/.*?\.app_.*?_(.*?)_thing_property_set.*/)[1];
        let updatedMuster
        if (matchedEntry.Typ == "DM") {
            updatedMuster = JSON.parse(JSON.stringify(musterslowChgPower));;
            updatedMuster.id = Date.now().toString()
            updatedMuster.params.id = matchedEntry.id
            updatedMuster.params[matchedEntry.ValueName] = Number(obj.state.val)
            SendJSON(JSON.stringify(updatedMuster), '/app/' + mqttDaten.UserID + '/' + asn + '/thing/property/set');
        } else if (matchedEntry.Typ == "D2") {
            updatedMuster = JSON.parse(JSON.stringify(musterDelta2));;
            updatedMuster.id = Date.now().toString()
            updatedMuster.moduleType = Number(matchedEntry.MT)
            updatedMuster.operateType = matchedEntry.name.replace("_D2", "")

            if (matchedEntry.AddParam) updatedMuster.params = JSON.parse(matchedEntry.AddParam);
            //updatedMuster.params.chgPauseFlag = 255
            updatedMuster.params[matchedEntry.ValueName] = Number(obj.state.val)
            SendJSON(JSON.stringify(updatedMuster), '/app/' + mqttDaten.UserID + '/' + asn + '/thing/property/set');
        } else if (matchedEntry.Typ == "PS" || matchedEntry.Typ == "Plug") {
            updatedMuster = JSON.parse(JSON.stringify(musterSetAC));
            if (Number(obj.state.val) <= -1) {
                delete updatedMuster.item.meta;
                delete updatedMuster.item.ValByte;
            }
            else {
                updatedMuster.header.pdata[matchedEntry.ValueName] = Number(obj.state.val)
                updatedMuster.header.dataLen = getVarintByteSize(Number(obj.state.val))
            }
            updatedMuster.header.cmdId = matchedEntry.id
            updatedMuster.header.cmdFunc = matchedEntry.cmdFunc || 20
            updatedMuster.header.seq = Date.now()
            updatedMuster.header.deviceSn = asn
            //log(JSON.stringify(updatedMuster))
            SendProto(JSON.stringify(updatedMuster), '/app/' + mqttDaten.UserID + '/' + asn + '/thing/property/set');
        } else {
            log("Write Event Unbekannter Typ: (" + matchedEntry.Typ + ") " + obj.id + " val: " + obj.state.val + ""); //
        }
        //log("Gefunden und gesendet:Topic: " + '/app/' + mqttDaten.UserID + '/' + asn + '/thing/property/set' + " Daten:" + JSON.stringify(updatedMuster))
        //SendJSON(JSON.stringify(updatedMuster), '/app/' + mqttDaten.UserID + '/' + asn + '/thing/property/set');
        //delete updatedMuster.params[matchedEntry.ValueName]
    } else {
        log("Write Event: " + obj.id + " val: " + obj.state.val + " | No matching entry found."); //
    }
    setState(obj.id, obj.state.val, true);
});

//State für die gesamte PV-Leistung 'totalPV' erstellen und beschreiben 
on({ id: new RegExp(ConfigData.statesPrefix + '\.app_device_property_[A-Za-z0-9]{13,17}\.data\.InverterHeartbeat\.sumPV'), change: "any" }, function (obj) {
    //log("sumpv Evemnt:" + obj.id + " val: " + obj.state.val)
    let totalPV = 0
    for (var i = 0; i < ConfigData.seriennummern.length; i++) {
        if (ConfigData.seriennummern[i].typ == "PS") {
            const asn = ConfigData.seriennummern[i].seriennummer
            if (isState2(ConfigData.statesPrefix + '.app_device_property_' + asn + '.data.InverterHeartbeat.sumPV')) {
                totalPV = totalPV + GetValAkt(ConfigData.statesPrefix + '.app_device_property_' + asn + '.data.InverterHeartbeat.sumPV', 60).val
            }
        }
    }
    totalPV = totalPV / 10

    let totalPVState = ConfigData.statesPrefix + '.totalPV';
    if (!existsState(totalPVState)) {
        createState(totalPVState, Number(totalPV.toFixed(0)));
    } else {
        setState(totalPVState, Number(totalPV.toFixed(0)));
        //log("Summe gesetzt für "+asn+": "+ sum)
    }
})

//Regulation State
if (ConfigData.RegulationState != "") {
    let eventid = ConfigData.statesPrefix + '.' + ConfigData.RegulationState
    ConfigData.Regulation = Boolean(getStateCr(eventid, ConfigData.Regulation, true).val)
    on({ id: eventid, change: "any", ack: false }, function (obj) {
        let name = obj.id.split('.').pop();
        //log(name + ":" + obj.state.val)

        if (ConfigData.RegulationOffPower >= 0 && !obj.state.val) {
            setAC(firstPsSn, ConfigData.RegulationOffPower * 10)
            GlobalObj[firstPsSn].OldNewValue = 0
        }
        ConfigData.Regulation = Boolean(obj.state.val)
    })
}

// Einstellen der Einspeiseleistung
function setAC(asn, Value) {
    if (!ConfigData.Regulation) {
        //return
    }
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
    setState(ConfigData.statesPrefix + '.app_' + mqttDaten.UserID + '_' + asn + '_thing_property_set.setAC', Value.toString(), true)
    SendProto(JSON.stringify(updatedMusterSetAC), '/app/' + mqttDaten.UserID + '/' + asn + '/thing/property/set');
}

// ########### Grundbedarf/Einspeiseleistung steuern
// Den niedrigsten oder durchschnittlichen Wert vom Gesamtverbrauch der letzten x Minuten ermitteln
function getLowestValue(id, minuten = 120) {
    const now = Date.now();
    const range = minuten * 60 * 1000;
    return new Promise((resolve, reject) => {
        sendTo('history.0', 'getHistory', {
            id: id,
            options: {
                start: now - range,
                end: now,
                aggregate: 'none',
                ignoreNull: true
            }
        }, (result) => {
            if (result.error) {
                log("getLowestValue-error: " + result.error);//
                reject(result.error);
            } else if (result.result && result.result.length > 0) {
                let lowestValue = result.result[0].val;
                let totalValue = result.result[0].val;
                if (ConfigData.MinValueAg === 0) {
                    for (let i = 1; i < result.result.length; i++) {
                        if (result.result[i].val < lowestValue) {
                            lowestValue = result.result[i].val;
                        }
                    }
                } else if (ConfigData.MinValueAg === 1) {
                    for (let i = 1; i < result.result.length; i++) {
                        totalValue += result.result[i].val;
                    }
                    lowestValue = totalValue / result.result.length; // Durchschnittswert
                }
                let Dauer = ((Date.now() - now) / 1000)
                if (Dauer > 1) log("getLowestValue-Duration: " + ((Date.now() - now) / 1000) + "s") //
                setStateNE(ConfigData.statesPrefix + ".lowestValue", Math.floor(Number(lowestValue)));
                resolve(Math.floor(Number(lowestValue)));
            } else {
                reject(new Error('No data'));
            }
        });
    });
}

//Einspeiseleistung berechnen und bei Änderung setzen
// Initialisiere die Globalen variablen
const GlobalObj = {}
for (var i = 0; i < ConfigData.seriennummern.length; i++) {
    const sn = ConfigData.seriennummern[i].seriennummer;
    if (!GlobalObj[sn]) {
        GlobalObj[sn] = {};
    }
    if (ConfigData.seriennummern[i].typ == "PS") {
        GlobalObj[sn].OldNewValue = -1
        GlobalObj[sn].FullPower = false
        GlobalObj[sn].zusatzpower = 0
        GlobalObj[sn].TempMaxPower = ConfigData.MaxPower
    }
}
//var OldNewValue = -1
//var FullPower = false
//let zusatzpower = 0
//let TempMaxPower = ConfigData.MaxPower
const ZUSATZPOWER_INCREMENT = 20
const BAT_MAX_OFFSET = 60
function SetBasePower(asn, needPowerFromOthersRek = null) {
    //log("SetBasePower " + asn)
    //return
    if (isState2(ConfigData.SmartmeterID) && ConfigData.Regulation) {
        let skip = false
        const ToHomeId = ConfigData.statesPrefix + ".app_device_property_" + asn + ".data.InverterHeartbeat.invOutputWatts"
        const batstate = Number(GetValAkt(ConfigData.statesPrefix + ".app_device_property_" + asn + ".data.InverterHeartbeat.batSoc", 600).val)
        const invOutputWatts = Number(GetValAkt(ToHomeId, 90, false).val.toFixed(0)) / 10
        const PrioMode = getStateCr(ConfigData.statesPrefix + '.app_' + mqttDaten.UserID + '_' + asn + '_thing_property_set.writeables.SetPrio', "0", true).val == "1" ? true : false
        let LeiststungsGap = ((GlobalObj[asn].OldNewValue) - invOutputWatts)
        let BatPower = Number(GetValAkt(ConfigData.statesPrefix + ".app_device_property_" + asn + ".data.InverterHeartbeat.batInputWatts", 600).val / 10)
        var foundItem = ConfigData.seriennummern.find(item => item.seriennummer === asn);
        if (foundItem.hasBat) {
            if (batstate >= foundItem.battPozOn && !GlobalObj[asn].FullPower && !PrioMode) {
                if (foundItem.battOnSwitchPrio) {
                    if (BatPower < 30) {
                        setStateNE(ConfigData.statesPrefix + '.app_' + mqttDaten.UserID + '_' + asn + '_thing_property_set.writeables.SetPrio', "1", false)
                        GlobalObj[asn].OldNewValue = -1
                        if (true || ConfigData.Debug) log("Batterie ist bei " + foundItem.battPozOn + "%: Schalte auf Batterie Prioritätsmodus.")
                        skip = true
                    }
                } else {
                    GlobalObj[asn].FullPower = true
                    setAC(asn, (Math.floor(ConfigData.MaxPower) * 10))
                    GlobalObj[asn].OldNewValue = (Math.floor(ConfigData.MaxPower))
                    if (true || ConfigData.Debug) log("Batterie ist bei " + foundItem.battPozOn + "%: Einspeisung auf Maximum.")
                    skip = true
                }
                getLowestValue(ConfigData.statesPrefix + ".RealPower", ConfigData.MinValueMin)
                //return
            } else if ((batstate > foundItem.battPozOff || batstate == 0) && (GlobalObj[asn].FullPower || PrioMode)) {
                getLowestValue(ConfigData.statesPrefix + ".RealPower", ConfigData.MinValueMin)
                if (foundItem.battOnSwitchPrio) {
                    // Hier noch Regeln einbinden zum frühzeitigen beeneden des Priomode
                    // Weiter unten nach der Bedarfsermittlung    

                } else {
                    skip = true
                }
                //return
            } else if (GlobalObj[asn].FullPower || PrioMode) {
                GlobalObj[asn].FullPower = false
                if (true || ConfigData.Debug) log("Batterie runter auf " + foundItem.battPozOff + "%: Normalbetrieb.")
                 if (foundItem.battOnSwitchPrio) {
                    setStateNE(ConfigData.statesPrefix + '.app_' + mqttDaten.UserID + '_' + asn + '_thing_property_set.writeables.SetPrio', "0", false)
                }
            }
            if (!skip) {
                const batInputWatts = ConfigData.statesPrefix + ".app_device_property_" + asn + ".data.InverterHeartbeat.batInputWatts"
                if (Number(GetValAkt(batInputWatts, 60).val) <= ((ConfigData.MaxPower - BAT_MAX_OFFSET) * -10)) {
                    if (GlobalObj[asn].zusatzpower < 300) {
                        if (GlobalObj[asn].zusatzpower == 0) { GlobalObj[asn].zusatzpower = invOutputWatts }
                        GlobalObj[asn].zusatzpower += ZUSATZPOWER_INCREMENT
                        log("Maximalleistung geht in die Batterie. Stelle zusätzlich Einspeisung auf " + GlobalObj[asn].zusatzpower + " W")
                        setAC(asn, ((GlobalObj[asn].zusatzpower) * 10));
                        GlobalObj[asn].OldNewValue = (GlobalObj[asn].zusatzpower)
                    }
                    getLowestValue(ConfigData.statesPrefix + ".RealPower", ConfigData.MinValueMin)
                    skip = true
                    //return
                } else {
                    if (Number(GetValAkt(batInputWatts, 60).val) >= ((ConfigData.MaxPower - 200) * -10) && GlobalObj[asn].zusatzpower > 0) {
                        GlobalObj[asn].zusatzpower = 0
                        log("-Zusatzpower aus !")

                    } else {
                        GlobalObj[asn].zusatzpower = GlobalObj[asn].zusatzpower - ZUSATZPOWER_INCREMENT
                        if (GlobalObj[asn].zusatzpower > 0) {
                            log("Maximalleistung geht in die Batterie. Stelle zusätzlich Einspeisung auf " + GlobalObj[asn].zusatzpower + " W")
                            setAC(asn, ((GlobalObj[asn].zusatzpower) * 10));
                            GlobalObj[asn].OldNewValue = (GlobalObj[asn].zusatzpower)
                            getLowestValue(ConfigData.statesPrefix + ".RealPower", ConfigData.MinValueMin)
                            skip = true
                            //return
                        } else {
                            if (GlobalObj[asn].zusatzpower > -ZUSATZPOWER_INCREMENT && GlobalObj[asn].zusatzpower <= 0) log("Zusatzpower aus !")
                            GlobalObj[asn].zusatzpower = 0
                        }
                    }
                }
            }
            if (!skip) {
                if (batstate < foundItem.lowBatLimitPozOn) {
                    if (GlobalObj[asn].TempMaxPower == ConfigData.MaxPower) log("Batteriestand unter Limit:" + foundItem.lowBatLimitPozOn + "% (" + batstate + "%). Limitiere Einspeiseleistung auf: " + foundItem.lowBatLimit + "W")
                    GlobalObj[asn].TempMaxPower = foundItem.lowBatLimit
                } else {
                    if (GlobalObj[asn].TempMaxPower == foundItem.lowBatLimit && batstate >= foundItem.lowBatLimitPozOff) {
                        log("Batteriestand ist jetzt über Limit:" + foundItem.lowBatLimitPozOff + "% (" + batstate + "%). Maximale Einspeisung wieder bei: " + ConfigData.MaxPower + "W")
                        GlobalObj[asn].TempMaxPower = ConfigData.MaxPower
                    }
                }
            }
        } else { //hasbat
            if (!GlobalObj[asn].FullPower) {
                GlobalObj[asn].FullPower = true
                if (true || ConfigData.Debug) log("PowerStream " + asn + " hat keine Batterie konfiguriert. Einspeisung auf Maximum. (" + ConfigData.MaxPower + ")")
                setAC(asn, (Math.floor(ConfigData.MaxPower) * 10))
            }
            GlobalObj[asn].OldNewValue = (Math.floor(ConfigData.MaxPower))
            getLowestValue(ConfigData.statesPrefix + ".RealPower", ConfigData.MinValueMin)
            skip = true
            //return
        }//hasbat
        //log ("regelung GlobalObj[asn].OldNewValue:" + GlobalObj[asn].OldNewValue)
        getLowestValue(ConfigData.statesPrefix + ".RealPower", ConfigData.MinValueMin)
            .then(lowestValue => {
                //log("SetBasePower lowestValue " + lowestValue)
                if (lowestValue != 0) {
                    //var invOutputWatts = 0
                    //const ToHomeId = ConfigData.statesPrefix + ".app_device_property_" + asn + ".data.InverterHeartbeat.invOutputWatts"
                    if (isState2(ToHomeId)) {
                        //invOutputWatts = Number(GetValAkt(ToHomeId,90).val) / 10
                        let NewValue
                        if (needPowerFromOthersRek !== null) {
                            NewValue = needPowerFromOthersRek
                        } else {
                            NewValue = (lowestValue - ConfigData.BasePowerOffset)
                        }
                        //Einspeisung der andernen Powerstream feststellen und abziehen:
                        let otherPS = 0
                        for (var i = 0; i < ConfigData.seriennummern.length; i++) {
                            if (ConfigData.seriennummern[i].typ == "PS" && ConfigData.seriennummern[i].seriennummer != asn) {
                                const asn = ConfigData.seriennummern[i].seriennummer
                                otherPS = otherPS + Number(GetValAkt(ConfigData.statesPrefix + '.app_device_property_' + asn + '.data.InverterHeartbeat.invOutputWatts', 90).val)
                                //log("otherPS: " + otherPS / 10)
                            }
                        }
                        //log("-- LeiststungsGap " + LeiststungsGap.toFixed(1) + " OldNewValue:" + GlobalObj[asn].OldNewValue + " invOutputWatts:" + invOutputWatts)

                        if (foundItem.battOnSwitchPrio) {
                            // Hier noch Regeln einbinden zum frühzeitigen beeneden des Priomode
                            if (PrioMode) {
                                if (LeiststungsGap > 30) {
                                    log("Priomode ist an. LeiststungsGap " + LeiststungsGap.toFixed(1) + " OldNewValue:" + GlobalObj[asn].OldNewValue + " invOutputWatts:" + invOutputWatts)
                                    log("Schalte den jetzt Priomode aus")
                                    setStateNE(ConfigData.statesPrefix + '.app_' + mqttDaten.UserID + '_' + asn + '_thing_property_set.writeables.SetPrio', "0", false)
                                }
                            }
                        } else {
                            //skip = true
                        }

                        //******
                        //const powerValue = needPowerFromOthersRek !== null ? needPowerFromOthersRek : 0;
                        if (ConfigData.RegulationMultiPsMode == 1) {
                            let calcValue = NewValue
                            let myMaxPower = GlobalObj[asn].TempMaxPower

                            //log("LeiststungsGap " + LeiststungsGap + " OldNewValue:" + GlobalObj[asn].OldNewValue)
                            if (LeiststungsGap > 10) {
                                myMaxPower = invOutputWatts
                            }
                            let needPowerFromOthers = calcValue - myMaxPower
                            //log("needPowerFromOthers " + needPowerFromOthers + " myMaxPower:" + myMaxPower)
                            serialRegulation(asn, needPowerFromOthers)
                            if (needPowerFromOthers > 0) {
                                NewValue = GlobalObj[asn].TempMaxPower
                            }
                        } else {
                            NewValue = Number((NewValue - (otherPS / 10)).toFixed(0))
                            if (NewValue > GlobalObj[asn].TempMaxPower) NewValue = GlobalObj[asn].TempMaxPower
                        }
                        //******

                        if (skip) return

                        if (NewValue < 0) NewValue = 0
                        //log("Newval:" + NewValue)
                        //log("LowVal in " + ConfigData.MinValueMin + " Minuten: " + lowestValue + " W, Andere: " + (otherPS / 10) + " W, Offset " + ConfigData.BasePowerOffset + "W, neu: " + NewValue + " W");
                        if (false || ConfigData.Debug) {
                            log("Tiefster Wert der letzten " + ConfigData.MinValueMin + " Minuten: " + lowestValue + " W");//
                            log("Summe der Anderen PS:     " + (otherPS / 10) + " W");//
                            log("Rest ist:     " + Math.floor((lowestValue) - (otherPS / 10)) + " W");//
                            log("Offset von: " + ConfigData.BasePowerOffset + " W abziehen = " + (Math.floor((lowestValue) - (otherPS / 10)) - ConfigData.BasePowerOffset) + " W Neuer Einspeisewert")//
                            log("Neuer Wert unter Berücksichtigung der Limits: " + NewValue + " W")//
                            log("Einspeisung aktuell: " + invOutputWatts + " W")//
                            log("===================================================") //
                        }
                        //setAC(asn,10)
                        if (GlobalObj[asn].OldNewValue != NewValue) {
                            setAC(asn, (Math.floor(NewValue) * 10))
                            if (false || ConfigData.Debug) log("Änderung für Einspeisung gesendet: " + Math.floor(NewValue) + " W") //
                        }
                        GlobalObj[asn].OldNewValue = NewValue
                    }
                }
            })
            .catch(error => {
                log("Fehler beim Abrufen des niedrigsten Werts: " + error); //
            });
    }
}

function serialRegulation(asn, PowerNeeded) {
    var foundIndex = ConfigData.seriennummern.findIndex(item => item.seriennummer === asn) || 0;
    for (var i = foundIndex + 1; i < ConfigData.seriennummern.length; i++) {
        if (ConfigData.seriennummern[i].typ == "PS" && ConfigData.seriennummern[i].regulation && ConfigData.seriennummern[i].seriennummer != asn) {
            //log("Rekursivaufruf an :" + ConfigData.seriennummern[i].seriennummer + " für Restleistung:" + PowerNeeded)
            SetBasePower(ConfigData.seriennummern[i].seriennummer, PowerNeeded)
            break;
        }
    }
}


function serialRegulationalt(asn, PowerNeeded) {
    for (var y = 0; y < ConfigData.seriennummern.length; y++) {
        var i = (firstPsSnIndex + y + 1) % ConfigData.seriennummern.length;
        if (ConfigData.seriennummern[i].typ == "PS" && ConfigData.seriennummern[i].regulation && ConfigData.seriennummern[i].seriennummer != asn) {
            const ToHomeId = ConfigData.statesPrefix + ".app_device_property_" + ConfigData.seriennummern[i].seriennummer + ".data.InverterHeartbeat.invOutputWatts"
            const permanentWatts = Number(GetValAkt(ConfigData.statesPrefix + ".app_device_property_" + ConfigData.seriennummern[i].seriennummer + ".data.InverterHeartbeat.permanentWatts", 90, false).val.toFixed(0)) / 10
            const invOutputWatts = Number(GetValAkt(ToHomeId, 90, false).val.toFixed(0)) / 10
            //let newsetVal = (Math.floor(invOutputWatts + PowerNeeded) * 10)
            let newsetVal = (Math.floor(PowerNeeded) * 10)
            if (newsetVal < 0) newsetVal = 0
            if (newsetVal == 0 && permanentWatts == 0) {

            } else {
                setAC(ConfigData.seriennummern[i].seriennummer, newsetVal)
            }
            GlobalObj[ConfigData.seriennummern[i].seriennummer].OldNewValue = newsetVal
            //setAC(ConfigData.seriennummern[i].seriennummer, (Math.floor( PowerNeeded) * 10))
            //firstPsSn = ConfigData.seriennummern[i].seriennummer;
            //firstPsSnIndex = i
            break;
        }
    }
}


function GetValAkt(id, minuten = 15, reset = true) {
    if (isState2(id)) {
        const state = getState(id)
        if (state.ts > Date.now() - minuten * 60 * 1000) {
            return state
        } else {
            if (typeof state.val === 'number') {
                if (reset && state.val != 0) setState(id, 0, true)
            } else {
                if (reset && state.val != "0") setState(id, "0", true)
            }
            state.val = 0
            return state
        }
    } else {
        //log("Kein State: " + id + "lege an.")
        createState(id, "0", false)
        //return getState(id)

        const leerstate = {}
        leerstate.val = "0"
        leerstate.ts = Date.now()
        return leerstate
    }
}


async function createMyState(name, value = undefined) {
    const stateName = ConfigData.statesPrefix + '.' + name;
    if (!globalState[stateName]) {
        const state = {
            name: name.split('.').pop(),
            role: 'state',
            //type: 'string', // 'number', 'boolean', usw.
            read: true,
            write: true,
        };
        // @ts-ignore
        globalState[stateName] = state;
        log(globalState);
        // Wenn der optionale Parameter value übergeben wurde, schreibe den Wert in den State
    }
}


function getStateCr(id, initValue, ack = false, common = {}, native = {}) {
    if (!isState2(id)) {
        let valueType = typeof initValue;
        let name = id.split('.').pop();
        if (Object.keys(common).length === 0) {
            common = {
                name: name,
                type: valueType,
                role: 'state',
                read: true,
                write: true,
            };
        }
        createState(id, initValue, false, common, native)
        //log("getStateCr: " + id)
        const leerstate = {}
        leerstate.val = initValue
        leerstate.ts = Date.now()
        return leerstate
    } else {
        return getState(id);
    }
}

function setStateNE(id, value, ack = false, common = {}, native = {}) {
    existsState(id, function (err, exists) {
        if (!exists) {
            let valueType = typeof value;
            let name = id.split('.').pop();
            if (Object.keys(common).length === 0) {
                common = {
                    name: name,
                    type: valueType,
                    role: 'state',
                    read: true,
                    write: true,
                };
            }
            createState(id, value, false, common, native, function () {
                setState(id, value, ack);
            });
        } else {
            setState(id, value, ack);
        }
    });
}

// State RealPower anlegen wenn noch nicht vorhanden und History aktivieren
if (isState2(ConfigData.SmartmeterID)) {
    if (!isState2(ConfigData.statesPrefix + ".RealPower")) {
        const stateObject = {
            name: "RealPower",
            role: "state",
            type: "number",
            read: true,
            write: true,
            custom: {
                "history.0": {
                    enabled: true,
                    aliasId: "",
                    debounceTime: 0,
                    blockTime: 0,
                    changesOnly: false,
                    changesRelogInterval: 0,
                    changesMinDelta: 0,
                    ignoreBelowNumber: "",
                    disableSkippedValueLogging: true,
                    retention: 86400,
                    customRetentionDuration: 365,
                    maxLength: 960,
                    enableDebugLogs: false,
                    debounce: 1000
                }
            }
        };
        createState(ConfigData.statesPrefix + ".RealPower", stateObject, function () {
            //*
            const stateId = ConfigData.statesPrefix + ".RealPower"; // Hier den ID des States angeben
            // Aktiviere die History-Funktion für den State
            const historyOptions = {
                id: stateId,
                options: {
                    enabled: true // Setze den Wert auf true, um die History zu aktivieren
                }
            };

            sendTo("history.0", "enableHistory", historyOptions, (result) => {
                if (result.error) {
                    log("Fehler beim Aktivieren der History für " + stateId + ": " + result.error);//
                } else {
                    log("History für " + stateId + " erfolgreich aktiviert");//
                }
            });
            //
        });

    }
    //Wert für den realen Verbrauch. Wird alle 5 Sekunden gesetzt, wenn sich die Werte vom Smartmeter ändern
    let WorkInProz = false
    const SECONDS_DELAY = 5;
    const DIVISION_FACTOR = 10;
    const TOLERANCE_PERIOD_FACTOR = 2;
    let LastRealPower = 0
    on({ id: ConfigData.SmartmeterID, change: "any" }, function (obj) {
        if (!WorkInProz) {
            WorkInProz = true;
            setTimeout(function () {
                const Hausstrom = Number(getState(ConfigData.SmartmeterID).val);
                let Einspeisung = 0;

                for (const item of ConfigData.seriennummern) {
                    if (item.typ == "PS") {
                        const asn = item.seriennummer;
                        const LastACset = getState(ConfigData.statesPrefix + '.app_' + mqttDaten.UserID + '_' + asn + '_thing_property_set.setAC').ts;
                        const invOutputWattsState = GetValAkt(ConfigData.statesPrefix + ".app_device_property_" + asn + ".data.InverterHeartbeat.invOutputWatts", 50, true);
                        const invOutputWatts = Number(invOutputWattsState.val) / DIVISION_FACTOR;
                        const lastOutset = invOutputWattsState.ts;

                        if ((Number(lastOutset) < Number(LastACset)) && invOutputWatts !== 0) {
                            const lastRealset = getState(ConfigData.statesPrefix + ".RealPower").ts;
                            if (Number(lastRealset) > Date.now() - ((ConfigData.MinValueMin * 1000 * 60) / TOLERANCE_PERIOD_FACTOR)) {
                                //log("RealPower Set Warte auf aktuelle Daten von: " + asn + " lezter: " + new Date(lastOutset).toLocaleTimeString('de-DE') + " / ACset: " + new Date(LastACset).toLocaleTimeString('de-DE'));
                                WorkInProz = false;
                                return;
                            } else {
                                //log("Überspringe ab jetzt warten auf Daten von: " + asn + " und setzte Wert für Einspeisung auf 0 ")
                                //setState(ConfigData.statesPrefix + ".app_device_property_" + asn + ".data.InverterHeartbeat.invOutputWatts", "0")
                                Einspeisung += invOutputWatts;
                            }
                        } else {

                            Einspeisung += invOutputWatts;
                        }
                    }
                }
                const RealPower = Number((Hausstrom + Einspeisung).toFixed(0))
                if (RealPower + 100 < LastRealPower) {
                    //log("PeakSkip Delta: " + (LastRealPower - RealPower) )
                } else {
                    setState(ConfigData.statesPrefix + ".RealPower", RealPower);
                }
                LastRealPower = RealPower
                WorkInProz = false;
            }, SECONDS_DELAY * 1000);
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

