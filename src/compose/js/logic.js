const VF = Vex.Flow;
const divStave = document.getElementById("my-stave");
const renderer = new VF.Renderer(divStave, VF.Renderer.Backends.SVG);
const context = renderer.getContext();
const bars = [];
const divToggleNoteToRest = document.getElementById("change-note-to-rest");
var isPutRest;
var rendererWidth;
var rendererHeight;
var amountOfBarsPerRow;
var leftMargin = 0;
var rightMargin = 0;

class Bar {
    constructor(stave, notes, x, y) {
        this.stave = stave;
        this.notes = notes;
        this.x = x;
        this.y = y;
    }
}

function setInitialData() {
    isPutRest = false;
    rendererWidth = BAR_SIZE_CLEF + EXTRA_RENDERER_SPACE;
    rendererHeight = BAR_WIDTH + EXTRA_RENDERER_SPACE;
    renderer.resize(rendererWidth, rendererHeight);
    leftMargin = getComputedStyle(document.querySelector("body"))
        .getPropertyValue("--margin-left")
        .slice(0, -2);
    rightMargin = getComputedStyle(document.querySelector("body"))
        .getPropertyValue("--margin-right")
        .slice(0, -2);
}

function createNewBarFullOfSilences(barPos) {
    let widthAndX = calculateWidthAndX(barPos);
    let heightAndY = calculateHeightAndY(barPos);

    let stave = createStave(barPos, widthAndX, heightAndY);
    let notes = [
        new VF.StaveNote({ clef: "treble", keys: ["b/4"], duration: "qr" }),
        new VF.StaveNote({ clef: "treble", keys: ["b/4"], duration: "qr" }),
        new VF.StaveNote({ clef: "treble", keys: ["b/4"], duration: "qr" }),
        new VF.StaveNote({ clef: "treble", keys: ["b/4"], duration: "qr" }),
    ];
    bars[barPos] = new Bar(stave, notes, widthAndX, heightAndY);
}

function calculateWidthAndX(barPos) {
    if (bars.length == 0) {
        //empty bars
        return STAVE_MARGIN_LEFT;
    }
    let previousBar = getLastBar(barPos);

    //If it's 0 we are in first bar of row, and 1 means the second bar of row
    // let widthAndXPosition = Math.floor(barPos % amountOfBarsPerRow);

    let widthAndXPositioner = barPos % amountOfBarsPerRow;
    if (widthAndXPositioner == 0) {
        return STAVE_MARGIN_LEFT;
    } else {
        return previousBar.stave.x + previousBar.stave.width;
    }
}

function calculateHeightAndY(barPos) {
    if (bars.length == 0) {
        //empty bars
        return STAVE_MARGIN_TOP;
    }
    let previousBar = getLastBar(barPos);
    let heightAndYMultiplier = Math.floor(barPos / amountOfBarsPerRow);

    return STAVE_MARGIN_TOP + BAR_WIDTH * heightAndYMultiplier;
}

function getLastBar(posBarToCreate) {
    return bars[posBarToCreate - 1];
}

function createStave(barPos, widthAndX, heightAndY) {
    let widthAndXPositioner = barPos % amountOfBarsPerRow;
    let stave = new VF.Stave(
        barPos == 0 ? STAVE_MARGIN_LEFT : widthAndX,
        barPos == 0 ? STAVE_MARGIN_TOP : heightAndY,
        widthAndXPositioner == 0 ? BAR_SIZE_CLEF : BAR_SIZE
    ).setContext(context);
    if (barPos == 0) stave.addTimeSignature("4/4");
    if (widthAndXPositioner == 0) stave.addClef("treble");
    if (barPos == bars.length - 1 || bars.length == 0)
        stave.setEndBarType(Vex.Flow.Barline.type.END);
    return stave;
}

function calculateNote() {
    let yPosInAnyBar = (yPositionClick - 40) % 100;
    if (yPosInAnyBar >= 27.5 && yPosInAnyBar <= 32.5) {
        return ["g/5"];
    } else if (yPosInAnyBar >= 32.5 && yPosInAnyBar <= 37.5) {
        return ["f/5"];
    } else if (yPosInAnyBar >= 37.5 && yPosInAnyBar <= 42.5) {
        return ["e/5"];
    } else if (yPosInAnyBar >= 42.5 && yPosInAnyBar <= 47.5) {
        return ["d/5"];
    } else if (yPosInAnyBar >= 47.5 && yPosInAnyBar <= 52.5) {
        return ["c/5"];
    } else if (yPosInAnyBar >= 52.5 && yPosInAnyBar <= 57.5) {
        return ["b/4"];
    } else if (yPosInAnyBar >= 57.5 && yPosInAnyBar <= 62.5) {
        return ["a/4"];
    } else if (yPosInAnyBar >= 62.5 && yPosInAnyBar <= 67.5) {
        return ["g/4"];
    } else if (yPosInAnyBar >= 67.5 && yPosInAnyBar <= 72.5) {
        return ["f/4"];
    } else if (yPosInAnyBar >= 72.5 && yPosInAnyBar <= 77.5) {
        return ["e/4"];
    } else if (yPosInAnyBar >= 77.5 && yPosInAnyBar <= 82.5) {
        return ["d/4"];
    } else if (yPosInAnyBar >= 82.5 && yPosInAnyBar <= 87.5) {
        return ["c/4"];
    }
    return null;
}

function getBarPosition() {
    return Math.floor((xPositionClick - BAR_SIZE_WITH_MARGIN_X) / BAR_SIZE) + 1;
}

function getRowNumber() {
    return Math.floor((yPositionClick - 40) / 100);
}

function calculatePos() {
    if (xPositionClick <= BAR_SIZE_WITH_MARGIN_X) { //if (getBarPosition() == 0)
        if (getRowNumber() == 0) {
            return Math.trunc((xPositionClick - 70) / 55) % BEATS_PER_BAR;
        }
        return Math.trunc((xPositionClick - 40) / 60) % BEATS_PER_BAR;
    } else if (xPositionClick > BAR_SIZE_WITH_MARGIN_X) {
        return (
            Math.trunc((xPositionClick - BAR_SIZE_WITH_MARGIN_X) / 57.5) %
            BEATS_PER_BAR
        );
    }
}

function calculateBar() {
    let barPosition = getBarPosition();
    let rowNumber = getRowNumber();
    let barNumber = barPosition + rowNumber * amountOfBarsPerRow;
    return bars[barNumber];
}

function addNewNote() {
    let bar = calculateBar();
    let note = calculateNote();
    let pos = calculatePos();
    console.log(note, pos, bar);
    if (!note || !bar) return;
    
    bar.notes[pos] = new VF.StaveNote({
        clef: "treble",
        keys: note,
        duration: !isPutRest ? "q" : "qr",
    }); //.addAccidental(0, new VF.Accidental("#")); //THIS SHOULD BE IN DRAW
}
    
    function lastBarHasOneNote(lastBar) {
        return !(
        bars[lastBar].notes[0].customTypes[0] === REST &&
        bars[lastBar].notes[1].customTypes[0] === REST &&
        bars[lastBar].notes[2].customTypes[0] === REST &&
        bars[lastBar].notes[3].customTypes[0] === REST
    );
}

function recalculateBars() {
    for (let barPos = 0; barPos < bars.length; barPos++) {
        let widthAndX = calculateWidthAndX(barPos);
        let heightAndY = calculateHeightAndY(barPos);
        let stave = createStave(barPos, widthAndX, heightAndY);
        let notes = bars[barPos].notes;
        let x = widthAndX;
        let y = heightAndY;

        let barRecalculated = new Bar(stave, notes, x, y);
        bars[barPos] = barRecalculated;
    }
}

function changeAmountOfBarsPerRowRegardingScreenWidth() {
    let screenWidth = window.innerWidth + 20 - leftMargin - rightMargin;
    let firstBarSize = BAR_SIZE_CLEF + 50;
    let screenWidthRemaining = screenWidth - firstBarSize; //1 row
    amountOfBarsPerRow = 1;
    while (true) {
        screenWidthRemaining -= BAR_SIZE;
        if (screenWidthRemaining < 0) break;
        amountOfBarsPerRow++;
    }
}

//TODO: add a button somewhere that will call this function to delete last bar
function deleteLastBar() {
    delete bars[bars.length - 1];
}
