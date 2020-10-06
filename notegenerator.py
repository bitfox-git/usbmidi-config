midinotelist = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"]

totalnumber = 0
MIDINumber = -2
currentnotevolt = -60
for n in range(10):
  for y in range(12):
    print(str(totalnumber) + ": '" + midinotelist[y] + str(MIDINumber) + " | " + '{0:.3f}'.format(currentnotevolt/12) + " Volt',")
    totalnumber += 1
    currentnotevolt += 1
  MIDINumber += 1


for n in range(8):
  print(str(totalnumber) + ": '" + midinotelist[n] + str(MIDINumber) + " | " + '{0:.3f}'.format(currentnotevolt/12) + " Volt',")
  totalnumber += 1
  currentnotevolt += 1


for n in range(256):
  time = ((20*(1.0283**n-1)+1)/1000)
  if(time < 1):
    print(str(n) + ": '" + '{0:.1f}'.format(time*1000) + " Milliseconds',")
  if(time >= 1):
    print(str(n) + ": '" + '{0:.1f}'.format(time) + " Seconds',")
    

# timingsize = 256
# for n in range(timingsize):
#     samples = listtime[n]*samplerate
#     time = 5/samples

