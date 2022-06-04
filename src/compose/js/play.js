var synth;
function calculateInstrument() {
    switch (instrument) {
        case "piano": {
            return new Tone.Synth({
                volume: -10,
                oscillator: {
                    type: "sine",
                },
                envelope: {
                    attack: 0.01,
                    decay: 0.01,
                    sustain: 1,
                    release: 0.5,
                },
            }).toMaster();
        }
        case "flute": {
            return new Tone.FMSynth({
                volume: -10,
                harmonicity: 3,
                modulationIndex: 10,
                detune: 0,
                oscillator: {
                    type: "sine",
                },
                envelope: {
                    attack: 0.01,
                    decay: 0.01,
                    sustain: 1,
                    release: 0.5,
                },
                modulation: {
                    type: "triangle",
                },
                modulationEnvelope: {
                    attack: 0.5,
                    decay: 0,
                    sustain: 1,
                    release: 0.5,
                },
            }).toMaster();
        }
        case "bass": {
            var autoWah = new Tone.AutoWah(120, 10, -20).toMaster();
            return new Tone.MonoSynth({
                volume: -10,
                envelope: {
                    attack: 0.1,
                    decay: 0.3,
                    release: 2,
                },
                filterEnvelope: {
                    attack: 0.001,
                    decay: 0.01,
                    sustain: 0.5,
                    baseFrequency: 440,
                    octaves: 2.6,
                },
            }).connect(autoWah);
        }
        case "guitar": {
            return new Tone.Synth({
                volume: -10,
                oscillator: {
                    type: "fatsawtooth",
                },
                envelope: {
                    attack: 0.01,
                    decay: 0.01,
                    sustain: 1,
                    release: 0.5,
                },
            }).toMaster();
        }
    }
}

function calculateNotes() {
    let notes = [];
    for (let bar of BARS) {
        for (let note of bar.notes) {
            pitch = note.keys[0].charAt(0).toUpperCase();
            console.log(note.keys[0]);
            // accidental = note.modifiers[0]?note.modifiers[0].type:"";
            accidental = note.keys[0].split("/")[0].substring(1);
            octave = note.keys[0].split("/").pop();
            duration = note.duration;
            rest = note.customTypes[0] === "r";
            notes.push({
                pitch,
                accidental,
                octave,
                duration,
                rest,
            });
        }
    }

    return notes;
}

function addDelayRegardingBpm(delay, noteValue, bpm) {
    return delay + noteValue * (60 / bpm);
}

// toggle play button to play/pause 
function play() {
    console.log(BARS);
    notes = calculateNotes();
    synth = calculateInstrument();
    console.log(synth)
    console.log(notes);
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
    // Reestablish button from play to start
    let timeOutId = setTimeout(
        ()=>{

        },
        delay
    );

    clearTimeout(timeOutId);
}

function stopMusic() {
    // stop synth from sounding
    synth.triggerRelease();
    
    Tone.Transport.stop();
    Tone.Transport.cancel();
}