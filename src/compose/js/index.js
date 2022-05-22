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
    //LOGIC
    addOneNoteToCurrentNotes();

    if (currentBarHasOneNote()) {
        createNewBarFullOfSilences(bars.length);
        renderer.resize(rendererWidth, rendererHeight);
    } else if (currentBarHasFourNotes()) {
        currentBar = bars[bars.length-1]
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
    draw() 
}

function draw() {
    calculateRendererSize(); //This is not draw, but this must be done every time, this should me moved to a better place ASAP
    clearScreen();
    drawAll();
}

function divToggleNoteToRestClicked() {
    isPutRest = !isPutRest;
}

//Listeners
divStave.addEventListener("click", divStaveClicked);
window.addEventListener("resize", windowSizeChanged);
divToggleNoteToRest.addEventListener("click", divToggleNoteToRestClicked);

initialLoad();