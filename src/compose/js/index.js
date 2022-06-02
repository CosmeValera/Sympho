function initialLoad() {
    //LOGIC
    setInitialData();
    createNewBarFullOfSilences(0);

    windowSizeChanged();
    mouseToggle();

    //DRAW
    setInitialLayout();
    draw();
}

function divStaveClicked(evt) {
    //CLICK
    getRelativePosition(evt);

    //LOGIC
    if (isMouseToggled) {
        selectNote();
    } else {
        addNewNote();
    }

    if (lastBarHasOneNote(bars.length - 1)) {
        createNewBarFullOfSilences(bars.length);
    }
    recalculateBars();

    //DRAW
    draw();
}

function windowSizeChanged(evt) {
    //LOGIC
    changeAmountOfBarsPerRowRegardingScreenWidth();

    recalculateBars();

    //DRAW
    draw();
}

function draw() {
    calculateRendererSize(); //This is not draw, but this must be done every time, this should me moved to a better place ASAP
    clearScreen();
    drawAll();
}

initialLoad();
