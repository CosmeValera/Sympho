const synth = new Tone.Synth().toDestination();

// var notes = [
//     { pitch: "B", accidental: "bb", octave: "4", duration: 4, rest: false },
//     { pitch: "C", accidental: "bb", octave: "4", duration: 4, rest: true },
//     { pitch: "D", accidental: "###", octave: "4", duration: 8, rest: false },
//     { pitch: "E", accidental: "", octave: "4", duration: 8, rest: true },
//     { pitch: "F", accidental: "", octave: "4", duration: 2, rest: false },
// ];

function calculateNotes() {
  let notes = [];
    for (let bar of bars) {
      for (let note of bar.notes) {
        // let noteClone = Object.assign({}, note);

        // console.log(noteClone)
        // console.log("pitch:", noteClone.keys[0].charAt(0).toUpperCase());
        // console.log("acccidental:", noteClone.modifiers[0]?noteClone.modifiers[0].type:"");
        // console.log("octave", noteClone.keys[0].split("/").pop());
        // console.log("duration:", noteClone.duration);
        // con
        // let pitch = "C";
        // let accidental = "";
        // let octave = "4";
        // let duration = 4;
        // let rest = false;

        // noteClones.push(noteClone);
        
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
        // notes.map(note => {
        //     pitch = note.keys[0].charAt(0).toUpperCase();
        //     accidental = note.modifiers[0]?note.modifiers[0].type:"";
        //     octave = note.keys[0].split("/").pop();
        //     duration = note.duration;
        //     rest = note.customTypes[0] === "r";
        //     return { pitch, accidental, octave, duration, rest };
        // });
      }
    }

    return notes;
}

function play() {
  console.log(bars);
    notes = calculateNotes();
    console.log(notes)
    let delay = Tone.now();
    for (let i = 0; i < notes.length; i++) {
        let waitingForNextNote = 4 / notes[i].duration;
        if (i > 0) {
            let noteValue = 4 / notes[i - 1].duration;
            delay += noteValue;
        }
        if (!notes[i].rest) {
            synth.triggerAttackRelease(
                notes[i].pitch + notes[i].accidental + notes[i].octave,
                waitingForNextNote,
                delay
            );
        }
    }
}

divPlay.addEventListener("click", play);
