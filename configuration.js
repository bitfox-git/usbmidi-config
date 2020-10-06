class Configuration {
  constructor(){
    this.mode = 10;
    this.midichannel = 255;
    this.byte2 = 0;
    this.byte3 = 0;
  }  
}

class MasterConfig {
  constructor() {
    this.analogconfig = [];
    this.digitalconfig = [];
    for (let index = 0; index < 4; index++) {
      this.analogconfig.push(new Configuration());  
      this.digitalconfig.push(new Configuration());  
    }
  }
}

var configuration;

function ConfigSaveTxt() {
  HTMLToJS();
  var blob = new Blob([JSON.stringify(configuration)], { type: "text/plain" });
  
  var a = document.createElement('a');
  a.download = "USBMIDI Configuration.txt";
  a.href = URL.createObjectURL(blob);
  a.dataset.downloadurl = ["text/plain", a.download, a.href].join(':');
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(function() { URL.revokeObjectURL(a.href); }, 1500);
}

var midialive = false;
function CheckUsbMidiAlive() {
  if(midiout != null) {
    midiout.send([0xF0,0x00,0x46,0x47,0x57,0x00,0x00,0xF7]);
    midialive = true;
  } else {
    console.log("No valid Midi Device is connected");
  }

}
function LoadConfig() {
  if(midiout != null) {
    midiout.send([0xF0,0x00,0x46,0x47,0x57,0x00,0x7B,0xF7]);
    console.log("Loading Last active Configuration");
  } else {
    console.log("No valid Midi Device is connected");
  }
}   
function SaveUserData() {
  if(midiout != null) {
    midiout.send([0xF0,0x00,0x46,0x47,0x57,0x00,0x74,0xF7]);
    console.log("Saving Current User data to non volatile flash storage");
  } else {
    console.log("No valid Midi Device is connected");
  }
}   

var configurationreceive = false;
function GetConfigurationData() {
  if(midiout != null) {
    midiout.send([0xF0,0x00,0x46,0x47,0x57,0x00,0x7E,0xF7]);
    console.log("Receiving current Configuration Data");
    configurationreceive = true;
  } else {
    console.log("No valid Midi Device is connected");
  }
}

function ProgramChange() {  
  if(midiout != null) {
    console.log("Loaded Program: " + document.getElementById("proginput").valueAsNumber)
    midiout.send([0xC0,document.getElementById("proginput").valueAsNumber-1]);
  } else {
    console.log("No valid Midi Device is connected");
  }
}

var midiupdate = false;
function SendConfigToUSBMIDI() {  
  HTMLToJS();
  configlist = [];
  for (let index = 0; index < 64; index++) {
    tempindex = Math.floor(index/4);
    tempcomp = (configuration[tempindex].analogconfig[index%4].mode & 0xFF) << 24;
    tempcomp += (configuration[tempindex].analogconfig[index%4].midichannel & 0xFF) << 16;
    tempcomp += (configuration[tempindex].analogconfig[index%4].byte2 & 0xFF) << 8;
    tempcomp += (configuration[tempindex].analogconfig[index%4].byte3 & 0xFF);
    configlist.push(tempcomp);

    tempcomp = (configuration[tempindex].digitalconfig[index%4].mode & 0xFF) << 24;
    tempcomp += (configuration[tempindex].digitalconfig[index%4].midichannel & 0xFF) << 16;
    tempcomp += (configuration[tempindex].digitalconfig[index%4].byte2 & 0xFF) << 8;
    tempcomp += (configuration[tempindex].digitalconfig[index%4].byte3 & 0xFF);
    configlist.push(tempcomp);
  }
  
  var bufsize = (512/4)*5+8;
  var buf = new Uint8Array(bufsize);
  buf[0] = 0xF0;
  buf[1] = 0x00;
  buf[2] = 0x46;
  buf[3] = 0x47;
  buf[4] = 0x57;
  buf[5] = 0x00;
  buf[6] = 0x75;

  for (let index = 0; index < 128; index++) {
    input = configlist[index];
    buf[5*index+7] = (input >> 0) & 0x7F;
    buf[5*index+8] = (input >> 7) & 0x7F;
    buf[5*index+9] = (input >> 14) & 0x7F;
    buf[5*index+10] = (input >> 21) & 0x7F;
    buf[5*index+11] = (input >> 28) & 0x7F;
  }

  buf[5*128+7] = 0xF7;
  if(midiout != null) {
    midiout.send(buf);
    console.log("Configuration Information Send");
  } else {
    console.log("No valid Midi Device is connected");
  }
}

const configurationselector = document.getElementById('open-config');
configurationselector.addEventListener('change', (event) => {
  var file = event.target.files[0];
  var reader = new FileReader();
  reader.readAsText(file);
  reader.onload = function(e) {
    configuration = JSON.parse(reader.result);
    JSToHTML();
  }
});

function getMIDIMessage(midiMessage) {
  if(midiMessage.currentTarget == midiin) {
    if(midiMessage.data.length == 3 && midialive == true) {
      console.log("Bitfox USBMIDI device is alive ! Version: " + midiMessage.data[1])
      midialive = false;
    }

    else if(configurationreceive == true) {
      var arrsize = 128;
      var checkarray = new Uint32Array(arrsize);
      for (let index = 0; index < arrsize; index++) {
        checkarray[index] = MidiBytesToWord(midiMessage.data.slice(index*5+1,index*5+6));
      }
      var compbuffer = new Uint8Array(checkarray.buffer); 
      for (let index = 0; index < 64; index++) {
        tempindex = Math.floor(index/4);

        configuration[tempindex].analogconfig[index%4].mode = compbuffer[index*8+3];
        configuration[tempindex].analogconfig[index%4].midichannel = compbuffer[index*8+2];
        configuration[tempindex].analogconfig[index%4].byte2 = compbuffer[index*8+1];
        configuration[tempindex].analogconfig[index%4].byte3 = compbuffer[index*8+0];
        
        configuration[tempindex].digitalconfig[index%4].mode = compbuffer[index*8+7];
        configuration[tempindex].digitalconfig[index%4].midichannel = compbuffer[index*8+6];
        configuration[tempindex].digitalconfig[index%4].byte2 = compbuffer[index*8+5];
        configuration[tempindex].digitalconfig[index%4].byte3 = compbuffer[index*8+4];
      }
      JSToHTML();
      console.log(configuration);
      console.log("Received Configuration Data from USBMIDI");
      configurationreceive = false;
    }
  }
}


function MidiBytesToWord(bufferarray) {
  var temp = bufferarray[0] + (bufferarray[1] << 7 & 0x00003F80)  + (bufferarray[2] << 14 & 0x001FC000) + (bufferarray[3] << 21 & 0x0FE00000)  + (bufferarray[4] << 28 & 0xF0000000);
  // Create a buffer
  var buf = new ArrayBuffer(4);
  var view = new DataView(buf);
  view.setUint32(0,temp);

  // Read the bits as a float; note that by doing this, we're implicitly
  // converting it from a 32-bit float into JavaScript's native 64-bit double
  var num = view.getUint32(0);
  return num;
}

function MidiBytesTofloat(bufferarray) {
  var temp = bufferarray[0] + (bufferarray[1] << 7 & 0x00003F80)  + (bufferarray[2] << 14 & 0x001FC000) + (bufferarray[3] << 21 & 0x0FE00000)  + (bufferarray[4] << 28 & 0xF0000000);
  // Create a buffer
  var buf = new ArrayBuffer(4);
  var view = new DataView(buf);
  view.setUint32(0,temp);

  // Read the bits as a float; note that by doing this, we're implicitly
  // converting it from a 32-bit float into JavaScript's native 64-bit double
  var num = view.getFloat32(0);
  return num;
}

function JSToHTML() {
  for (let i = 0; i < 4; i++) {
    var anamidi = document.getElementById("select-midi-" + String(i)); 
    var anamode = document.getElementById("select-mode-" + String(i)); 
    var anabyte2 = document.getElementById("select-byte2-" + String(i)); 
    var anabyte3 = document.getElementById("select-byte3-" + String(i)); 
    
    var digimidi = document.getElementById("select-midi-" + String(i+4)); 
    var digimode = document.getElementById("select-mode-" + String(i+4)); 
    var digibyte2 = document.getElementById("select-byte2-" + String(i+4)); 
    var digibyte3 = document.getElementById("select-byte3-" + String(i+4)); 
    
    anamidi.value = configuration[currentnumber].analogconfig[i].midichannel;
    anamode.value = configuration[currentnumber].analogconfig[i].mode;
    CheckAnalogByte2(i);
    CheckAnalogByte3(i);
    anabyte2.value = configuration[currentnumber].analogconfig[i].byte2;
    anabyte3.value = configuration[currentnumber].analogconfig[i].byte3;
    
    
    digimidi.value = configuration[currentnumber].digitalconfig[i].midichannel;
    digimode.value = configuration[currentnumber].digitalconfig[i].mode;
    CheckDigitalByte2(i);
    CheckDigitalByte3(i);
    digibyte2.value = configuration[currentnumber].digitalconfig[i].byte2;
    digibyte3.value = configuration[currentnumber].digitalconfig[i].byte3;
    
  }
}

function HTMLToJS() {
  for (let i = 0; i < 4; i++) {
    var anamidi = document.getElementById("select-midi-" + String(i)); 
    var anamode = document.getElementById("select-mode-" + String(i)); 
    var anabyte2 = document.getElementById("select-byte2-" + String(i)); 
    var anabyte3 = document.getElementById("select-byte3-" + String(i)); 
    
    var digimidi = document.getElementById("select-midi-" + String(i+4)); 
    var digimode = document.getElementById("select-mode-" + String(i+4)); 
    var digibyte2 = document.getElementById("select-byte2-" + String(i+4)); 
    var digibyte3 = document.getElementById("select-byte3-" + String(i+4)); 
    
    configuration[currentnumber].analogconfig[i].midichannel = anamidi.value;
    configuration[currentnumber].analogconfig[i].mode = anamode.value;
    configuration[currentnumber].analogconfig[i].byte2 = anabyte2.value;
    configuration[currentnumber].analogconfig[i].byte3 = anabyte3.value;

    configuration[currentnumber].digitalconfig[i].midichannel = digimidi.value;
    configuration[currentnumber].digitalconfig[i].mode = digimode.value;
    configuration[currentnumber].digitalconfig[i].byte2 = digibyte2.value;
    configuration[currentnumber].digitalconfig[i].byte3 = digibyte3.value;
  }
}

function CheckAnalogByte2(i) {
  var anamode = document.getElementById("select-mode-" + String(i)); 
  var anabyte2 = document.getElementById("select-byte2-" + String(i));

  anamodevalue = Number(anamode.value);
  if(anamodevalue in analogbyte2list) {
    var tempstring = "";
    for (const key in analogbyte2list[anamodevalue]) {
      tempstring += `<option value="${key}">${analogbyte2list[anamodevalue][key]}</option>`;
    }
    anabyte2.innerHTML = tempstring;
    anabyte2.style.visibility = "visible";
  } else {
    anabyte2.style.visibility = "hidden";
  }
}

function CheckAnalogByte3(i) {
  var anamode = document.getElementById("select-mode-" + String(i)); 
  var anabyte3 = document.getElementById("select-byte3-" + String(i));

  anamodevalue = Number(anamode.value);
  if(anamodevalue in analogbyte3list) {
    var tempstring = "";
    for (const key in analogbyte3list[anamodevalue]) {
      tempstring += `<option value="${key}">${analogbyte3list[anamodevalue][key]}</option>`;
    }
    anabyte3.innerHTML = tempstring;
    anabyte3.style.visibility = "visible";
  } else {
    anabyte3.style.visibility = "hidden";
  }
}

function CheckDigitalByte2(i) {
  var digimode = document.getElementById("select-mode-" + String(i+4)); 
  var digibyte2 = document.getElementById("select-byte2-" + String(i+4));

  digimodevalue = Number(digimode.value);

  if(digimodevalue in digitalbyte2list) {
    var tempstring = "";
    for (const key in digitalbyte2list[digimodevalue]) {
      tempstring += `<option value="${key}">${digitalbyte2list[digimodevalue][key]}</option>`;
    }
    digibyte2.innerHTML = tempstring;
    digibyte2.style.visibility = "visible";
  } else {
    digibyte2.style.visibility = "hidden";
  }
}

function CheckDigitalByte3(i) {
  var digimode = document.getElementById("select-mode-" + String(i+4)); 
  var digibyte3 = document.getElementById("select-byte3-" + String(i+4));

  digimodevalue = Number(digimode.value);

  if(digimodevalue in digitalbyte3list) {
    var tempstring = "";
    for (const key in digitalbyte3list[digimodevalue]) {
      tempstring += `<option value="${key}">${digitalbyte3list[digimodevalue][key]}</option>`;
    }
    digibyte3.innerHTML = tempstring;
    digibyte3.style.visibility = "visible";
  } else {
    digibyte3.style.visibility = "hidden";
  }
}

function CheckAnalogBytes(number) {
  CheckAnalogByte2(number);
  CheckAnalogByte3(number);
}

function CheckDigitalBytes(number) {
  CheckDigitalByte2(number);
  CheckDigitalByte3(number);
}

var currentnumber = 0;
function ChangePreset(number) {
  HTMLToJS();
  currentnumber = number;
  JSToHTML();
}


var configuration = JSON.parse(defaultpreset);

select = document.getElementById("select");

for (let index = 0; index < 16; index++) {
  select.innerHTML += `<button onclick="ChangePreset(${index})" style="width:3em;height:3em; margin-bottom: 50px"; float:middle;>${index+1}</button>`
}
select.innerHTML += "<br>";

for (let index = 0; index < 4; index++) {

  select.innerHTML += `<label>Analog ${index+1}: </label><select id=select-midi-${index}></select>`;
  select.innerHTML += `<select onchange="CheckAnalogBytes(${index})" id=select-mode-${index}></select>`;
  select.innerHTML += `<select id=select-byte2-${index}></select>`;
  select.innerHTML += `<select id=select-byte3-${index}></select>`;
  select.innerHTML += "<br>";

  select.innerHTML += `<label>Digital ${index+1}: </label><select id=select-midi-${index+4}></select>`;
  select.innerHTML += `<select onchange="CheckDigitalBytes(${index})" id=select-mode-${index+4}></select>`;
  select.innerHTML += `<select id=select-byte2-${index+4}></select>`;
  select.innerHTML += `<select id=select-byte3-${index+4}></select>`;
  select.innerHTML += "<br>";
  select.innerHTML += "<br>";
}


for (const key in midichannel) {
  for (let i = 0; i < 8; i++) {
    document.getElementById("select-midi-" + i).innerHTML += `<option value="${key}">${midichannel[key]}</option>`;
    
  }  
}
for (const key in analogmodelist) {
  for (let i = 0; i < 4; i++) {
    document.getElementById("select-mode-" + i).innerHTML += `<option value="${key}">${analogmodelist[key]}</option>`;
    
  }  
}
for (const key in digitalmodelist) {
  for (let i = 0; i < 4; i++) {
    document.getElementById("select-mode-" + String(4+i)).innerHTML += `<option value="${key}">${digitalmodelist[key]}</option>`;
  }  
}

// Make Sure This gets imported correctly
JSToHTML();
