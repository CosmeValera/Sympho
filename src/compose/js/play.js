const synth = new Tone.MembraneSynth({
  "envelope" : {
    "sustain" : 0,
    "attack" : 0.02,
    "decay" : 0.8
  },
  "octaves" : 10
}).toDestination();

// var notes = [
//     { pitch: "B", accidental: "bb", octave: "4", duration: 4, rest: false },
//     { pitch: "E", accidental: "", octave: "4", duration: 8, rest: true },
//     { pitch: "F", accidental: "", octave: "4", duration: 2, rest: false },
// ];

function calculateNotes() {
  let notes = [];
    for (let bar of bars) {
      for (let note of bar.notes) {
        pitch = note.keys[0].charAt(0).toUpperCase();
        console.log(note.keys[0]);
        // accidental = note.modifiers[0]?note.modifiers[0].type:"";
        accidental = note.keys[0].split("/")[0].substring(1);
        octave = note.keys[0].split("/").pop();
        duration = note.duration;
        rest = note.customTypes[0] === "r";
        notes.push({
           pitch, accidental, octave, duration, rest 
        });
      }
    }

    return notes;
}

function addDelayRegardingBpm(delay, noteValue, bpm) {
    return delay + noteValue * (60 / bpm);
}

function play() {
  console.log(bars);
  notes = calculateNotes();
  console.log(notes)
  let delay = Tone.now();
  for (let i = 0; i < notes.length; i++) {
      let thisNoteLength = 4 / notes[i].duration;
      if (i > 0) {
          let noteValue = 4 / notes[i - 1].duration;
          delay = addDelayRegardingBpm(delay, noteValue, bpm);
      }
      if (!notes[i].rest) {
        // console.log(Tone.now()- delay)
          synth.triggerAttackRelease(
              notes[i].pitch + notes[i].accidental + notes[i].octave,
              thisNoteLength,
              delay
          );
      }
    }
}

divPlay.addEventListener("click", play);
