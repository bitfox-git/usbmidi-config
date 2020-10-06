var midiaccess
var midiin;
var midiout;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

navigator.requestMIDIAccess({ sysex: true })
  .then(onMIDISuccess, onMIDIFailure);

function onMIDISuccess(midiAccess) {
  midiaccess = midiAccess;
  midiAccess.onstatechange = function(e) {
    // Print information about the (dis)connected MIDI controller
    CheckMidiPorts();
  };
  CheckMidiPorts();
}

function onMIDIFailure() {
  console.log('Could not access your MIDI devices. Either allow access or use a different browser (Chrome or FireFox)');
}


function CheckMidiPorts() {
  console.log("Checking for midi devices");
  midiin = null;
  midiout = null;
  for (var input of midiaccess.inputs.values()) {
    if(input.name == "Bitfox USBMIDI"){
      midiin = input;
      input.onmidimessage = getMIDIMessage;
    }
  }
  for (var output of midiaccess.outputs.values()) {
    if(output.name == "Bitfox USBMIDI"){
      midiout = output;
      midialive = false;
    }
  }
  if(midiout == null || midiin == null) {
    console.log("No valid Bitfox USBMIDI Device found");
  } else {
    console.log("Valid Bitfox USBMIDI Device found");
  }
}    