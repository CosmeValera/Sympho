const VF = Vex.Flow;
const divStave = document.getElementById("my-stave");
const renderer = new VF.Renderer(divStave, VF.Renderer.Backends.SVG);
const context = renderer.getContext();
const bars = [];
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

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}
function addOneNoteToCurrentNotes() {
    let pos = findPositionOfFirstSilenceNote();
    let noteInt = getRandomInt(4);
    currentBar.notes[pos] = new VF.StaveNote({
        clef: "treble",
        keys: [
            noteInt == 0
                ? "e/4"
                : noteInt == 1
                ? "d/5"
                : noteInt == 2
                ? "b/4"
                : "g/4",
        ],
        duration: "q",
    }); //.addAccidental(0, new VF.Accidental("#")); //THIS SHOULD BE IN DRAW
}

function findPositionOfFirstSilenceNote() {
    for (let notePos = 0; notePos < currentBar.notes.length; notePos++) {
        if (currentBar.notes[notePos].customTypes[0] === REST) {
            return notePos;
        }
    }
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
