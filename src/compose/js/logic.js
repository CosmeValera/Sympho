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
var currentBar;
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
    rendererWidth = BAR_SIZE_CLEF + 50;
    rendererHeight = BAR_WIDTH_CLEF;
    renderer.resize(rendererWidth, rendererHeight);
    amountOfBarsPerRow = 4;
    leftMargin = getComputedStyle(
        document.querySelector("body")
    ).getPropertyValue("--margin-left").slice(0,-2);
    rightMargin = getComputedStyle(
        document.querySelector("body")
    ).getPropertyValue("--margin-right").slice(0,-2);
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
        return 10;
    }
    let previousBar = getLastBar(barPos);

    //If it's 0 we are in first bar of row, and 1 means the second bar of row
    // let widthAndXPosition = Math.floor(barPos % amountOfBarsPerRow);

    let widthAndXPositioner = barPos % amountOfBarsPerRow;
    if (widthAndXPositioner == 0) {
        return 10;
    } else {
        return previousBar.stave.x + previousBar.stave.width;
    }
}

function calculateHeightAndY(barPos) {
    if (bars.length == 0) {
        //empty bars
        return 40;
    }
    let previousBar = getLastBar(barPos);
    let heightAndYMultiplier = Math.floor(barPos / amountOfBarsPerRow);

    return 40 + 100 * heightAndYMultiplier;
}

function getLastBar(posBarToCreate) {
    return bars[posBarToCreate - 1];
}

function createStave(barPos, widthAndX, heightAndY) {
    let widthAndXPositioner = barPos % amountOfBarsPerRow;
    let stave = new VF.Stave(
        barPos == 0 ? 10 : widthAndX,
        barPos == 0 ? 40 : heightAndY,
        widthAndXPositioner == 0 ? BAR_SIZE_CLEF : BAR_SIZE
    ).setContext(context);
    if (barPos == 0) stave.addTimeSignature("4/4");
    if (widthAndXPositioner == 0) stave.addClef("treble");
    if (barPos == bars.length - 1 || bars.length == 0)
        stave.setEndBarType(Vex.Flow.Barline.type.END);
    return stave;
}

function calculateNote() {

    if (yPositionClick>=67.5 && yPositionClick<=72.5) {
        return ["g/5"];
    } else if (yPositionClick>=72.5 && yPositionClick<=77.5) {
        return ["f/5"];
    } else if (yPositionClick>=77.5 && yPositionClick<=82.5) {
        return ["e/5"];
    } else if (yPositionClick>=82.5 && yPositionClick<=87.5) {
        return ["d/5"];
    } else if (yPositionClick>=87.5 && yPositionClick<=92.5) {
        return ["c/5"];
    } else if (yPositionClick>=92.5 && yPositionClick<=97.5) {
        return ["b/4"];
    } else if (yPositionClick>=97.5 && yPositionClick<=102.5) {
        return ["a/4"];
    } else if (yPositionClick>=102.5 && yPositionClick<=107.5) {
        return ["g/4"];
    } else if (yPositionClick>=107.5 && yPositionClick<=112.5) {
        return ["f/4"];
    } else if (yPositionClick>=112.5 && yPositionClick<=117.5) {
        return ["e/4"];
    } else if (yPositionClick>=117.5 && yPositionClick<=122.5) {
        return ["d/4"];
    } else if (yPositionClick>=122.5 && yPositionClick<=127.5) {
        return ["c/4"];
    }
    return null;
}


function findPositionOfFirstSilenceNote() {
    if (xPositionClick >= 70 && xPositionClick <= 125) { 
        currentBar = bars[0];
        return 0;
    } else if (xPositionClick >= 125 && xPositionClick <= 180) {
        currentBar = bars[0];
        return 1;
    } else if (xPositionClick >= 180 && xPositionClick <= 235) {
        currentBar = bars[0];
        return 2;
    } else if (xPositionClick >= 235 && xPositionClick <= 290) {
        currentBar = bars[0];
        return 3;
    }

    if (xPositionClick >= 290 && xPositionClick <= 352.5) { 
        if (!bars[1]) {
            return undefined;
        }
        currentBar = bars[1];
        return 0;
    } else if (xPositionClick >= 352.5 && xPositionClick <= 415) {
        if (!bars[1]) {
            return undefined;
        }
        currentBar = bars[1];
        return 1;
    } else if (xPositionClick >= 415 && xPositionClick <= 477.5) {
        if (!bars[1]) {
            return undefined;
        }
        currentBar = bars[1];
        return 2;
    } else if (xPositionClick >= 477.5 && xPositionClick <= 540) {
        if (!bars[1]) {
            return undefined;
        }
        currentBar = bars[1];
        return 3;
    }
}


function addOneNoteToCurrentNotes() {
    if (!xPositionClick || !yPositionClick) return;
    let note = calculateNote();
    let pos = findPositionOfFirstSilenceNote();
    if (!note) return;

    currentBar.notes[pos] = new VF.StaveNote({
        clef: "treble",
        keys: note,
        duration: (!isPutRest)?"q":"qr",
    }); //.addAccidental(0, new VF.Accidental("#")); //THIS SHOULD BE IN DRAW
}

function currentBarHasOneNote() {
    return (
        currentBar.notes[0].customTypes[0] !== REST &&
        currentBar.notes[1].customTypes[0] === REST &&
        currentBar.notes[2].customTypes[0] === REST &&
        currentBar.notes[3].customTypes[0] === REST
    );
}
function currentBarHasFourNotes() {
    return (
        currentBar.notes[0].customTypes[0] !== REST &&
        currentBar.notes[1].customTypes[0] !== REST &&
        currentBar.notes[2].customTypes[0] !== REST &&
        currentBar.notes[3].customTypes[0] !== REST
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
        //For each 240 px, remaining add 1 row
        screenWidthRemaining -= BAR_SIZE;
        if (screenWidthRemaining < 0) break;
        amountOfBarsPerRow++;
    }
}
