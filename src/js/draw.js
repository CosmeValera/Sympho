function drawAll() {
    for (bar of bars) {
        drawABar(bar);
    }
}

function drawABar(bar) {
    let voice = new VF.Voice({ num_beats: 4, beat_value: 4 });
    voice.addTickables(bar.notes);
    new VF.Formatter().joinVoices([voice]).format([voice], 350);
    bar.stave.draw();
    voice.draw(context, bar.stave);
}

function clearScreen() {
    context.clear();
}

function calculateRendererSize() {
    let minimumWidth = 450; //First bar
    let minimumHeight = 250; //First bar

    let width = (amountOfBarsPerRow-1) * 350 + minimumWidth;
    let heightAndYMultiplier = Math.floor((bars.length-1) / amountOfBarsPerRow);
    let height = (heightAndYMultiplier-1) * 100 + minimumHeight; 

    renderer.resize(width, height);
}
