// var leftMargin = 0; 
function drawAll() {
    for (bar of bars) {
        drawABar(bar);
    }
}

function drawABar(bar) {
    let voice = new VF.Voice({ num_beats: 4, beat_value: 4 });
    voice.addTickables(bar.notes);
    new VF.Formatter().joinVoices([voice]).format([voice], BAR_SIZE);
    bar.stave.draw();
    voice.draw(context, bar.stave);
}

function clearScreen() {
    context.clear();
}

function calculateRendererSize() {
    let minimumWidth = BAR_SIZE_CLEF + 50; //First bar
    let minimumHeight = BAR_WIDTH_CLEF; //First bar

    let width = (amountOfBarsPerRow-1) * BAR_SIZE + minimumWidth;
    let heightAndYMultiplier = Math.floor((bars.length-1) / amountOfBarsPerRow);
    let height = (heightAndYMultiplier-1) * 100 + minimumHeight; 

    renderer.resize(width, height);
}

function setInitialLayout() {
    // leftMargin = getComputedStyle(document.querySelector('body'))
    // .getPropertyValue('--margin-left');
    // console.log(leftMargin);
}