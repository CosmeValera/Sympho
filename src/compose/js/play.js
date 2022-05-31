const synth = new Tone.Synth().toDestination();

const notes = [
    { pitch: "C", accidental: "bb", octave: "4", duration: 4 },
    { pitch: "D", accidental: "###", octave: "4", duration: 8 },
    { pitch: "E", accidental: "", octave: "4", duration: 8 },
    { pitch: "F", accidental: "", octave: "4", duration: 2 },
];

function play() {
  console.log("HERE")
    let delay = Tone.now();
    for(let i = 0; i < notes.length; i++) {
      let waitingForNextNote = 4/notes[i].duration;
        if (i>0) {
          let noteValue = 4/notes[i-1].duration;
          delay += noteValue;
        }
        synth.triggerAttackRelease(notes[i].pitch + notes[i].accidental + notes[i].octave, waitingForNextNote, delay);  
    }
}

divPlay.addEventListener('click', play);