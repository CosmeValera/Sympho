// var leftMargin = 0;
function drawAll() {
    for (bar of bars) {
        drawABar(bar);
    }
}

function drawABar(bar) {
    let voice = new VF.Voice({ num_beats: BEATS_PER_BAR, beat_value: BEAT_VALUE });
    voice.addTickables(bar.notes);
    new VF.Formatter().joinVoices([voice]).format([voice], BAR_SIZE);
    bar.stave.draw();
    voice.draw(context, bar.stave);
}

function clearScreen() {
    context.clear();
}

function calculateRendererSize() {
    let minimumWidth = BAR_SIZE_CLEF + EXTRA_RENDERER_SPACE;
    let minimumHeight = BAR_WIDTH + EXTRA_RENDERER_SPACE;

    let width = (amountOfBarsPerRow - 1) * BAR_SIZE + minimumWidth;
    let heightAndYMultiplier = Math.floor((bars.length - 1) / amountOfBarsPerRow);
    let height = (heightAndYMultiplier) * BAR_WIDTH + minimumHeight;

    renderer.resize(width, height);
}

function setInitialLayout() {
    // leftMargin = getComputedStyle(document.querySelector('body'))
    // .getPropertyValue('--margin-left');
    // console.log(leftMargin);
}
