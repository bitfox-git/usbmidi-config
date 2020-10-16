
var midialive = false;

function CheckUsbMidiAlive() {
  midiout.send([0xF0,0x00,0x46,0x47,0x57,0x00,0x00,0xF7]);
  midialive = true;
}
function MidiSetUpdateBits() {
  midiout.send([0xF0,0x00,0x46,0x47,0x57,0x00,0x77,0xF7]);
}


var verifyindex;
var updatereceive;
var checkerror = false;

function getMIDIMessage(midiMessage) {
  if(midiMessage.currentTarget == midiin) {
    if(midiMessage.data.length == 3 && midialive == true) {
      console.log("Bitfox USBMIDI device is alive ! Version: " + midiMessage.data[1])
      midialive = false;
    }

    else if(updatereceive == true) {
      var arrsize = 0x2000 / 4;
      var checkarray = new Uint32Array(arrsize);
      for (let index = 0; index < arrsize; index++) {
        checkarray[index] = MidiBytesToWord(midiMessage.data.slice(index*5+1,index*5+6));
      }
      for (let index = 0; index < Math.min(arrsize, view.length - verifyindex * arrsize); index++) {
        if(checkarray[index] != view[index+verifyindex*arrsize]) {
          console.log("Page " + (verifyindex*4+1) + " - Page " + (verifyindex*4+4) + " FAILED");
          console.log("Failed on index: " + index);
          checkbool = true
          break;
        }
      }
      console.log("Page " + (verifyindex*4+1) + " - Page " + (verifyindex*4+4) + " Checked");
      verifyindex += 1;
      if(verifyindex == 15) {
        updatereceive = false;
        verifyindex = 0;
        if(checkerror == true) {
          console.log("App Update Check Failed :(!");
        } else {
          console.log("App Update Checked succesfully !");
          console.log("Resetting the device and updating the application");
          await sleep(10);
          MidiSetUpdateBits();
          console.log("Please wait a few seconds, the device will flash green and orange.");
          console.log("When the device has had its leds off for another 5 seconds, reinsert the USB cable and check if the device is alive");
        }
      }
    }
  }
}


async function midiappsend() {
  var pages = Math.ceil(view.length / 512);
  var midiappsendindex = 0;
  console.log("Started sending App Update Information");
  for (let i = 0; i < pages; i++) {    
    await sleep(500);
    var bufsize = Math.min(512, view.length - i * 512)
    var buf = new Uint8Array(5*bufsize+8);
    buf[0] = 0xF0;
    buf[1] = 0x00;
    buf[2] = 0x46;
    buf[3] = 0x47;
    buf[4] = 0x57;
    buf[5] = 0x00;
    if(i == 0) {
      buf[6] = 0x7A;
    } else if(i == pages-1) {
      buf[6] = 0x78;
    } else {
      buf[6] = 0x79;
    }
    for (let index = 0; index < bufsize; index++) {
      input = view[index+512*i];
      buf[5*index+7] = (input >> 0) & 0x7F;
      buf[5*index+8] = (input >> 7) & 0x7F;
      buf[5*index+9] = (input >> 14) & 0x7F;
      buf[5*index+10] = (input >> 21) & 0x7F;
      buf[5*index+11] = (input >> 28) & 0x7F;
    }
    
    buf[5*bufsize+7] = 0xF7;
    midiout.send(buf);
    console.log("Part " + (i+1) + " of " + pages + " parts");
  }
  console.log("Ended Sending App Update Information");
  console.log("Started Checking App Update Information");
  console.log("60 Pages in total");
  updatereceive = true; 
  verifyindex = 0;
}

var view;
const updateselector = document.getElementById('file-selector');
updateselector.addEventListener('change', (event) => {
  var file = event.target.files[0];
  var reader = new FileReader();
  reader.readAsArrayBuffer(file);

  if(file.name != "USBMIDI.bin") {
    console.log("File Name does not equal expected file name (USBMIDI.bin)");
    console.log("If you upload an invalid file the device will not be able to update itself again");
    return;
  }
  reader.onload = function(e) {
    view = new Uint32Array(reader.result); 
    midiappsend();
  }
});

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