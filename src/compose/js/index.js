function initialLoad() {
    //LOGIC
    setInitialData();
    createNewBarFullOfSilences(0);

    windowSizeChanged();

    //DRAW
    setInitialLayout();
    draw();
}

function divStaveClicked(evt) {
    //CLICK
    getRelativePosition(evt);

    //LOGIC
    if (isMouseTable2) {
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
// divStave.addEventListener("click", divStaveClicked);
mySectionStave.addEventListener("click", divStaveClicked);
window.addEventListener("resize", windowSizeChanged);
divMouseTable2.addEventListener("click", mouseToggle);
divSharpTable2.addEventListener("click", alterNote);
divFlatTable2.addEventListener("click", alterNote);
divDoubleSharpTable2.addEventListener("click", alterNote);
divDoubleFlatTable2.addEventListener("click", alterNote);
divToNote.addEventListener("click", () => {
    isPutRest = false;
});
divToRest.addEventListener("click", () => {
    isPutRest = true;
});
initialLoad();
