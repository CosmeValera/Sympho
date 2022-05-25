const VF = Vex.Flow;
const divStave = document.getElementById("my-stave");
const renderer = new VF.Renderer(divStave, VF.Renderer.Backends.SVG);
const context = renderer.getContext();
const bars = [];
const divToNote = document.getElementById("add-note");
const divToRest = document.getElementById("add-rest");
const divMouseTable2 = document.getElementById("mouse-table-2");
const divSharpTable2 = document.getElementById("sharp-table-2");
const divFlatTable2 = document.getElementById("flat-table-2");
const divDoubleSharpTable2 = document.getElementById("double-sharp-table-2");
const divDoubleFlatTable2 = document.getElementById("double-flat-table-2");
var isPutRest;
var isMouseTable2;
var selectedNote;
var rendererWidth;
var rendererHeight;
var amountOfBarsPerRow;
var leftMargin = 0;
var rightMargin = 0;

let notesMap = new Map([
    [1, ["c/6"]],
    [2, ["b/5"]],
    [3, ["a/5"]],
    [4, ["g/5"]],
    [5, ["f/5"]],
    [6, ["e/5"]],
    [7, ["d/5"]],
    [8, ["c/5"]],
    [9, ["b/4"]],
    [10, ["a/4"]],
    [11, ["g/4"]],
    [12, ["f/4"]],
    [13, ["e/4"]],
    [14, ["d/4"]],
    [15, ["c/4"]],
    [16, ["b/3"]],
])

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
    isMouseTable2 = false;
    isAddSharp = false;
    isAddFlat = false;
    selectedNote = null;
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
    renderer.resize(rendererWidth, rendererHeight);
}

function calculateWidthAndX(barPos) {
    if (bars.length == 0) { //empty bars
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
    if (bars.length == 0) { //empty bars
        return STAVE_MARGIN_TOP;
    }
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
    let yPosInAnyBar = Math.ceil(((yPositionClick - STAVE_MARGIN_TOP) % BAR_WIDTH - 18)/5);
    if (yPosInAnyBar < 0 || yPosInAnyBar > 16) {
        return null;
    }
    
    for (const [position, note] of notesMap.entries()) {
        if (yPosInAnyBar <= position) {
            return note;
        }
    }
}

function getRowNumber() {
    return Math.floor((yPositionClick - STAVE_MARGIN_TOP) / BAR_WIDTH);
}

function getBarPosition() {
    console.log(getRowNumber())
    if (getRowNumber() === 0) {
        return Math.floor((xPositionClick - BAR_SIZE_WITH_MARGIN_X) / BAR_SIZE) + 1;
    }
    return Math.floor((xPositionClick - BAR_SIZE_WITH_MARGIN_X + TEMPO_SIZE) / BAR_SIZE) + 1;
}

function calculatePos() {
    if (xPositionClick <= BAR_SIZE_WITH_MARGIN_X) { //if (getBarPosition() == 0)
        if (getRowNumber() == 0) {
            return Math.trunc((xPositionClick - STAVE_MARGIN_LEFT - CLEF_SIZE - TEMPO_SIZE) / 55) % BEATS_PER_BAR;
        }
        return Math.trunc((xPositionClick - STAVE_MARGIN_LEFT - TEMPO_SIZE) / 62.5) % BEATS_PER_BAR;
    } else if (xPositionClick > BAR_SIZE_WITH_MARGIN_X) {
        return (
            Math.trunc((xPositionClick - BAR_SIZE_WITH_MARGIN_X) / 57.5) %
            BEATS_PER_BAR
        );
    }
}

function calculateBar() {
    let rowNumber = getRowNumber();
    let barPosition = getBarPosition();
    let barNumber = barPosition + rowNumber * amountOfBarsPerRow;
    console.log(barPosition, rowNumber, barNumber)
    
    return barPosition < amountOfBarsPerRow && barPosition >= 0
        ? bars[barNumber]
        : undefined;
}

function addNewNote() {
    let bar = calculateBar();
    let note = calculateNote();
    let pos = calculatePos();
    console.log(bar, note, pos)
    if (!note || !bar) return;
    
    bar.notes[pos] = new VF.StaveNote({
        clef: "treble",
        keys: note,
        duration: !isPutRest ? "q" : "qr",
        auto_stem: true,
    });
}
    
function selectNote() {
    let bar = calculateBar();
    let note = calculateNote();
    let pos = calculatePos();
    if (!note || !bar) return;
    
    if (selectedNote) {
        selectedNote.setStyle({fillStyle: "Black", strokeStyle: "Black"});
    }
    selectedNote = bar.notes[pos];
    selectedNote.setStyle({fillStyle: "MediumBlue", strokeStyle: "MediumBlue"});
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

function mouseToggle() {
    isMouseTable2 = !isMouseTable2;
    if (selectedNote) {
        selectedNote.setStyle({fillStyle: "Black", strokeStyle: "Black"});
        selectedNote = null;
        draw();
    }
}

function saveAlteredNoteInBars(modifier) {
    selectedNote.modifiers = [];
    octaveNumber = selectedNote.keys[0].split("/").pop();
    selectedNote.keys[0] = `${modifier}/${octaveNumber}`;
    selectedNote.addAccidental(0, new VF.Accidental(modifier));
}

function alterNote(evt) {
    if (selectedNote) {
        if (evt.target.id === "sharp-table-2") {
            saveAlteredNoteInBars("#");
        } else if (evt.target.id === "flat-table-2") {
            saveAlteredNoteInBars("b");
        } else if (evt.target.id === "double-sharp-table-2") {
            saveAlteredNoteInBars("##");
        } else if (evt.target.id === "double-flat-table-2") {
            saveAlteredNoteInBars("bb");
        }
        recalculateBars();
        draw();
        console.log(bars)
    } else {
        alert("No note selected");
    }
}

//TODO: add a button somewhere that will call this function to delete last bar
function deleteLastBar() {
    delete bars[bars.length - 1];
}
