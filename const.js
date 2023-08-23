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

module.exports = {
  protoSource2,
  musterSetAC,
  writeables
}