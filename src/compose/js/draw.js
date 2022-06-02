function drawAll() {
    for (bar of BARS) {
        drawABar(bar);
    }
}

function drawABar(bar) {
    console.log(beats_per_bar, beat_value)
    const voice = new VF.Voice({ num_beats: beats_per_bar, beat_value: beat_value });
    voice.addTickables(bar.notes);
    new VF.Formatter().joinVoices([voice]).format([voice], BAR_SIZE);
    bar.stave.draw();
    voice.draw(context, bar.stave);
}

function clearScreen() {
    context.clear();
}

function calculateRendererSize() {
    let minimumWidth = BAR_SIZE_WITH_MARGIN_X + EXTRA_RENDERER_SPACE;
    let minimumHeight = BAR_WIDTH_WITH_MARGIN_Y + EXTRA_RENDERER_SPACE;

    let width = (amountOfBarsPerRow - 1) * BAR_SIZE + minimumWidth;
    let heightAndYMultiplier = Math.floor((BARS.length - 1) / amountOfBarsPerRow);
    let height = (heightAndYMultiplier) * BAR_WIDTH + minimumHeight;

    renderer.resize(width, height);
}

function setInitialLayout() {
    // leftMargin = getComputedStyle(document.querySelector('body'))
    // .getPropertyValue('--margin-left');
    // console.log(leftMargin);
}
