function initialLoad() {
    //LOGIC
    setInitialData();
    createNewBarFullOfSilences(0);
    currentBar = bars[0];

    windowSizeChanged();

    //DRAW
    setInitialLayout();
    draw();
}

function divStaveClicked(evt) {
    //CLICK
    getRelativePosition(evt);

    //LOGIC
    addNewNote();

    if (lastBarHasOneNote(bars.length - 1)) {
        createNewBarFullOfSilences(bars.length);
        renderer.resize(rendererWidth, rendererHeight);
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
divToggleNoteToRest.addEventListener("click", () => {
    isPutRest = !isPutRest;
});
divMouseTable2.addEventListener("click", () => {
    isMouseTable2 = !isMouseTable2;
})
divSharpTable2.addEventListener("click", () => {
    // if (!selectedNote) {
    //     return;
    // }
    
    // TODO: selectedNote add #
    console.log(VF)
    console.log(bars[0].notes[0])
    // bars[0].notes[0] = new VF.StaveNote({
    //     clef: "treble",
    //     keys: ["a#/4"],
    //     duration: "q",
    // }).addAccidental("A/4", new Vex.Flow.Accidental('b'));
    bars[0].notes[0] = new VF.StaveNote({
        clef: "treble",
        keys: ["f#/4"],
        duration: "q",
    }).addAccidental(0, new VF.Accidental("#"));
})
divFlatTable2.addEventListener("click", () => {
    // selectedNote add b
})

initialLoad();
