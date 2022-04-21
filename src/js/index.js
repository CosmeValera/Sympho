// // You can use anything you definddex in logic or in draw.js, e.g:
// let b = new Bar("s", "a")
// console.log(b.notes)

function initialLoad() {
    //LOGIC
    setInitialData();
    createNewBarFullOfSilences(0);
    currentBar = bars[0];
    
    windowSizeChanged();
    
    //DRAW
    draw();
}

function divBarClicked(evt) {
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

//Listeners
divStave.addEventListener("click", divBarClicked);
window.addEventListener("resize", windowSizeChanged);

initialLoad();