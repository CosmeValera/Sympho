var synth = new Tone.PolySynth().toMaster();

divPlay.addEventListener('click', function() {
    synth.triggerAttackRelease('C4', '8n');
});