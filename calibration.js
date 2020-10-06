class Calibration {
  constructor(){
    this.floatlow = new Float32Array(4);
    this.floathigh = new Float32Array(4);
  }
}

// Temp stuff 
var calibration = new Calibration();
var tempfloat = 1.42;
for (let index = 0; index < 4; index++) {
  calibration.floatlow[index] = tempfloat;
  tempfloat *= 1.2;
  calibration.floathigh[index] = tempfloat;
  tempfloat *= 1.2;
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
function CalibrationLow() {
  if(midiout != null) {
    midiout.send([0xF0,0x00,0x46,0x47,0x57,0x00,0x7C,0xF7]);
    console.log("Calibrating with Low DAC Value (this does not mean low voltage level)");
  } else {
  console.log("No valid Midi Device is connected");
  }
}
function CalibrationHigh() {
  if(midiout != null) {
    midiout.send([0xF0,0x00,0x46,0x47,0x57,0x00,0x7D,0xF7]);
    console.log("Calibrating with High DAC Value (this does not mean high voltage level)");
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

var calibrationreceive = false;
function GetCalibrationData() {
  if(midiout != null) {
    midiout.send([0xF0,0x00,0x46,0x47,0x57,0x00,0x7F,0xF7]);
    calibrationreceive = true;
    console.log("Receiving current Calibration Data");
  } else {
    console.log("No valid Midi Device is connected");
  }
}

function SendCalibToUSBMIDI() {  
  HTMLToJS(); 
  var bufsize = 8*5+8;
  var buf = new Uint8Array(bufsize);
  var buflow = new Uint32Array(calibration.floatlow.buffer);
  var bufhigh = new Uint32Array(calibration.floathigh.buffer);
  buf[0] = 0xF0;
  buf[1] = 0x00;
  buf[2] = 0x46;
  buf[3] = 0x47;
  buf[4] = 0x57;
  buf[5] = 0x00;
  buf[6] = 0x76;
  
  for (let index = 0; index < 4; index++) {
    input = buflow[index];
    buf[10*index+7] = (input >> 0) & 0x7F;
    buf[10*index+8] = (input >> 7) & 0x7F;
    buf[10*index+9] = (input >> 14) & 0x7F;
    buf[10*index+10] = (input >> 21) & 0x7F;
    buf[10*index+11] = (input >> 28) & 0x7F;
    input = bufhigh[index];
    buf[10*index+12] = (input >> 0) & 0x7F;
    buf[10*index+13] = (input >> 7) & 0x7F;
    buf[10*index+14] = (input >> 14) & 0x7F;
    buf[10*index+15] = (input >> 21) & 0x7F;
    buf[10*index+16] = (input >> 28) & 0x7F;
  }
  
  buf[5*8+7] = 0xF7;
  if(midiout != null) {
    midiout.send(buf);
    console.log("Calibration Information Send");
  } else {
    console.log("No valid Midi Device is connected");
  }
}

function CalibrationSaveText() {
  HTMLToJS();
  var blob = new Blob([JSON.stringify(calibration)], { type: "text/plain" });
  
  var a = document.createElement('a');
  a.download = "USBMIDI Calibration.txt";
  a.href = URL.createObjectURL(blob);
  a.dataset.downloadurl = ["text/plain", a.download, a.href].join(':');
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(function() { URL.revokeObjectURL(a.href); }, 1500);
}

const calibrationselector = document.getElementById('open-calib');
calibrationselector.addEventListener('change', (event) => {
  var file = event.target.files[0];
  var reader = new FileReader();
  reader.readAsText(file);
  reader.onload = function(e) { 
    calibration = JSON.parse(reader.result);
    JSToHTML(); 
  }
});

function getMIDIMessage(midiMessage) {
  if(midiMessage.currentTarget == midiin) {
    if(midiMessage.data.length == 3 && midialive == true) {
      console.log("Bitfox USBMIDI device is alive ! Version: " + midiMessage.data[1])
      midialive = false;
    }
    else if(calibrationreceive == true) {
      var arrsize = 8;
      var checkarray = new Float32Array(arrsize);
      for (let index = 0; index < arrsize; index++) {
        checkarray[index] = MidiBytesTofloat(midiMessage.data.slice(index*5+1,index*5+6));
      }
      var compbuffer = new Uint8Array(checkarray.buffer); 
      for (let index = 0; index < 4; index++) {
        calibration.floatlow[index] = checkarray[index*2+0];
        calibration.floathigh[index] =  checkarray[index*2+1];
      }
      JSToHTML();
      console.log("Received Calibration Data from USBMIDI");
      calibrationreceive = false;
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



inputdiv = document.getElementById("input");

for (let index = 0; index < 4; index++) {

  inputdiv.innerHTML += `<input type="number" step="0.01" value="${calibration.floatlow[index]}" id="input-low-${index}"/>Calibration Low CV ${index+1}   `;
  inputdiv.innerHTML += `<input type="number" step="0.01" value="${calibration.floathigh[index]}" id="input-high-${index}"/>Calibration High CV ${index+1}   `;

  inputdiv.innerHTML += "<br>";
}

function HTMLToJS() {
  for (let index = 0; index < 4; index++) {
    var inlow = document.getElementById("input-low-" + index);
    var inhigh = document.getElementById("input-high-" + index);
    calibration.floatlow[index] = inlow.valueAsNumber;
    calibration.floathigh[index] = inhigh.valueAsNumber;
  }
}
function JSToHTML() {
  for (let index = 0; index < 4; index++) {
    var inlow = document.getElementById("input-low-" + index);
    var inhigh = document.getElementById("input-high-" + index);
    inlow.value = calibration.floatlow[index];
    inhigh.value = calibration.floathigh[index];
  }
}
