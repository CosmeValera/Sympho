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

//Listeners
mySectionStave.addEventListener("click", divStaveClicked);
window.addEventListener("resize", windowSizeChanged);
divMouseToggle.addEventListener("click", mouseToggle);
divAddSharp.addEventListener("click", alterNote);
divAddFlat.addEventListener("click", alterNote);
divAddDoubleSharp.addEventListener("click", alterNote);
divAddDoubleFlat.addEventListener("click", alterNote);

divWholeNote.addEventListener("click", () => {
    isRest = false;
    noteDuration = 1;
});
divWholeRest.addEventListener("click", () => {
    isRest = true;
    noteDuration = 1;
});
divHalfNote.addEventListener("click", () => {
    isRest = false;
    noteDuration = 2;
});
divHalfRest.addEventListener("click", () => {
    isRest = true;
    noteDuration = 2;
});
divQuarterNote.addEventListener("click", () => {
    isRest = false;
    noteDuration = 4;
});
divQuarterRest.addEventListener("click", () => {
    isRest = true;
    noteDuration = 4;
});
divEighthNote.addEventListener("click", () => {
    isRest = false;
    noteDuration = 8;
});
divEighthRest.addEventListener("click", () => {
    isRest = true;
    noteDuration = 8;
});

initialLoad();
