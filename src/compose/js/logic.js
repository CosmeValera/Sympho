const VF = Vex.Flow;
const divStave = document.getElementById("my-stave");
const renderer = new VF.Renderer(divStave, VF.Renderer.Backends.SVG);
const context = renderer.getContext();
const bars = [];
const divHalfNote = document.getElementById("add-half-note");
const divHalfRest = document.getElementById("add-half-rest");
const divQuarterNote = document.getElementById("add-quarter-note");
const divQuarterRest = document.getElementById("add-quarter-rest");
const divEighthNote = document.getElementById("add-eighth-note");
const divEighthRest = document.getElementById("add-eighth-rest");
const divMouseToggle = document.getElementById("mouse-toggle");
const divAddSharp = document.getElementById("add-sharp");
const divAddFlat = document.getElementById("add-flat");
const divAddDoubleSharp = document.getElementById("add-double-sharp");
const divAddDoubleFlat = document.getElementById("add-double-flat");
var noteDuration;
var isRest;
var isMouseToggled;
var selectedNote;
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
]);

function setInitialData() {
    isRest = false;
    noteDuration = 4;
    isMouseToggled = true;
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
        new VF.StaveNote({ clef: "treble", keys: ["b/4"], duration: "4r" }),
        new VF.StaveNote({ clef: "treble", keys: ["b/4"], duration: "4r" }),
        new VF.StaveNote({ clef: "treble", keys: ["b/4"], duration: "4r" }),
        new VF.StaveNote({ clef: "treble", keys: ["b/4"], duration: "4r" }),
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
    }
    return previousBar.stave.x + previousBar.stave.width;
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
    if (xPositionClick < BAR_SIZE_WITH_MARGIN_X) {
        if (getRowNumber() === 0) {
            if (xPositionClick > STAVE_MARGIN_LEFT + CLEF_SIZE + TEMPO_SIZE ) {
                return 0;
            }
        } else if (getRowNumber() !== 0) {
            if (xPositionClick > STAVE_MARGIN_LEFT + CLEF_SIZE) {
                return 0;
            }
        }
        return undefined;
    }
    return Math.floor((xPositionClick - BAR_SIZE_WITH_MARGIN_X) / BAR_SIZE) + 1;
}

function calculateBar() {
    let rowNumber = getRowNumber();
    let barPosition = getBarPosition();
    let barNumber = barPosition + rowNumber * amountOfBarsPerRow;
    
    return barPosition < amountOfBarsPerRow && barPosition >= 0
        ? bars[barNumber]
        : undefined;
}

function calculatePosIf8Eighths() {
    if (xPositionClick <= BAR_SIZE_WITH_MARGIN_X) {
        if (xPositionClick > BAR_SIZE_WITH_MARGIN_X - SPACE_PER_NOTE) { 
            return (MAX_AMOUNT_NOTES_IN_A_BAR - 1)/2;
        } 
        return (getRowNumber() === 0)
            ? (Math.trunc((xPositionClick - CLEF_SIZE - TEMPO_SIZE) / SPACE_PER_NOTE) % MAX_AMOUNT_NOTES_IN_A_BAR) / 2
            : (Math.trunc((xPositionClick - STAVE_MARGIN_LEFT - TEMPO_SIZE) / SPACE_PER_NOTE) % MAX_AMOUNT_NOTES_IN_A_BAR) / 2;
    } else if (xPositionClick > BAR_SIZE_WITH_MARGIN_X) {
        return (
            (Math.trunc((xPositionClick - BAR_SIZE_WITH_MARGIN_X) / SPACE_PER_NOTE) % MAX_AMOUNT_NOTES_IN_A_BAR) / 2
        );
    }
}

function calculateRealPosRegardingArray(bar, pos) {
    let notes = bar.notes;
    let notesValues = notes.map(n => 4/n.duration);
    let sum = 0;
    for (let i = 0; i < notesValues.length; i++) {
        sum += notesValues[i];
        if (pos < sum) {
            return i;
        }
    }
}

function deleteFrom(notes, notePos) {
    delete notes[notePos];
    return notes.filter(n => n);
}

function alterBarNotesRegardingSpecialCases(newNoteDuration, previousNoteDuration, bar, realPos) {

    // This note is forth long than what there was
    if (newNoteDuration == previousNoteDuration*4) {
        bar.notes.splice(realPos + 1, 0, new VF.StaveNote({ clef: "treble", keys: ["b/4"], duration: newNoteDuration+"r" }));
        bar.notes.splice(realPos + 1, 0, new VF.StaveNote({ clef: "treble", keys: ["b/4"], duration: newNoteDuration+"r" }));
        bar.notes.splice(realPos + 1, 0, new VF.StaveNote({ clef: "treble", keys: ["b/4"], duration: newNoteDuration+"r" }));
    }

    // This note is half long than what there was
    if (newNoteDuration == previousNoteDuration*2) {
        bar.notes.splice(realPos + 1, 0, new VF.StaveNote({ clef: "treble", keys: ["b/4"], duration: newNoteDuration+"r" }));
    }

    // This note is double long
    if (newNoteDuration*2 == previousNoteDuration) {

        // TODO: REFACTOR THIS TO MAKE IT GENERAL
        if (newNoteDuration == 2 && previousNoteDuration == 4) {
            if (bar.notes[0].duration == "4" && bar.notes[1].duration == "2" && bar.notes[2].duration == "4") {
                if (realPos == 0) {
                    bar.notes = deleteFrom(bar.notes, realPos);
                    bar.notes = deleteFrom(bar.notes, realPos);
                    bar.notes.splice(realPos, 0, new VF.StaveNote({ clef: "treble", keys: ["b/4"], duration: "4r" }));
                    bar.notes.splice(realPos, 0, new VF.StaveNote({ clef: "treble", keys: ["b/4"], duration: "4r" }));
                }
                if (realPos == bar.notes.length - 1) {
                    return;
                }
            } else if(bar.notes[0].duration == "4" && bar.notes[1].duration == "4" && bar.notes[2].duration == "2") {
                bar.notes = deleteFrom(bar.notes, realPos);
                if (realPos == 1) {
                    realPos = 0;
                }
                return realPos;
            }
        }
        // END: REFACTOR THIS TO MAKE IT GENERAL

        if (realPos != bar.notes.length - 1 && bar.notes[realPos+1].duration == previousNoteDuration) {
            bar.notes = deleteFrom(bar.notes, realPos+1)
        } else if (realPos != 0 && bar.notes[realPos-1].duration == previousNoteDuration) {
            bar.notes = deleteFrom(bar.notes, realPos-1)
            realPos--;
        } else {
            return;
        }
    }

    // This note is four times longer
    // TODO: maybe the following if section can be improved by using some algorythm that searches
    // how many notes are after this one with same duration, and if there arent 4 in total, searches
    // backwards too. Right now this seems too many lines

    if (newNoteDuration*4 == previousNoteDuration) {
        if (realPos <= bar.notes.length - 4 && bar.notes[realPos+1].duration == previousNoteDuration
            && bar.notes[realPos+2].duration == previousNoteDuration
            && bar.notes[realPos+3].duration == previousNoteDuration) {
                bar.notes = deleteFrom(bar.notes, realPos+1);
                bar.notes = deleteFrom(bar.notes, realPos+1);
                bar.notes = deleteFrom(bar.notes, realPos+1);
        } else if (realPos >= 1 && realPos <= bar.notes.length - 3 
            && bar.notes[realPos-1].duration == previousNoteDuration
            && bar.notes[realPos+1].duration == previousNoteDuration
            && bar.notes[realPos+2].duration == previousNoteDuration) {
                bar.notes = deleteFrom(bar.notes, realPos+1);
                bar.notes = deleteFrom(bar.notes, realPos+1);
                bar.notes = deleteFrom(bar.notes, realPos-1)
                realPos--;
        } else if (realPos >= 2 && realPos <= bar.notes.length - 2
            && bar.notes[realPos+1].duration == previousNoteDuration
            && bar.notes[realPos-1].duration == previousNoteDuration
            && bar.notes[realPos-2].duration == previousNoteDuration) {
                bar.notes = deleteFrom(bar.notes, realPos+1)
                bar.notes = deleteFrom(bar.notes, realPos-1)
                realPos--;
                bar.notes = deleteFrom(bar.notes, realPos-1)
                realPos--;
        } else if (realPos >= 3 && bar.notes[realPos-1].duration == previousNoteDuration
            && bar.notes[realPos-2].duration == previousNoteDuration
            && bar.notes[realPos-3].duration == previousNoteDuration) {
                bar.notes = deleteFrom(bar.notes, realPos-1)
                realPos--;
                bar.notes = deleteFrom(bar.notes, realPos-1)
                realPos--;
                bar.notes = deleteFrom(bar.notes, realPos-1)
                realPos--;
        } else {
            return;
        }
    }

    console.log("bar= ", bar, ". realpos= ", realPos);

    return realPos;
}

function addNewNote() {
    let bar = calculateBar();
    let note = calculateNote();
    let pos = calculatePosIf8Eighths();
    if (!note || !bar) return;
    let realPos = calculateRealPosRegardingArray(bar, pos);
    
    let newNoteDuration = noteDuration;
    let previousNoteDuration = bar.notes[realPos].duration;

    realPos = alterBarNotesRegardingSpecialCases(newNoteDuration, previousNoteDuration, bar, realPos);

    newNoteDuration += isRest ? "r" : "";
    bar.notes[realPos] = new VF.StaveNote({
        clef: "treble",
        keys: note,
        duration: newNoteDuration,
        auto_stem: true,
    });
}
    
function selectNote() {
    let bar = calculateBar();
    let note = calculateNote();
    let pos = calculatePosIf8Eighths();
    if (!note || !bar) return;
    let realPos = calculateRealPosRegardingArray(bar, pos);
    
    if (selectedNote) {
        selectedNote.setStyle({fillStyle: "Black", strokeStyle: "Black"});
    }
    selectedNote = bar.notes[realPos];
    selectedNote.setStyle({fillStyle: "MediumBlue", strokeStyle: "MediumBlue"});
}
    
function lastBarHasOneNote(lastBar) {
    return bars[lastBar].notes.some(n => {
        if (!(n.customTypes[0][0] === 'r')) {
            return true;
        }
    });
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

function addClass(element, className) {
    element.classList.add(className);
}

function removeClass(element, className) {
    element.classList.remove(className);
}

function mouseToggle() {
    isMouseToggled = !isMouseToggled;

    if (isMouseToggled) {
        addClass(divHalfNote, "is-disabled");
        addClass(divHalfRest, "is-disabled");
        addClass(divQuarterNote, "is-disabled");
        addClass(divQuarterRest, "is-disabled");
        addClass(divEighthNote, "is-disabled");
        addClass(divEighthRest, "is-disabled");

        removeClass(divAddSharp, "is-disabled");
        removeClass(divAddDoubleSharp, "is-disabled");
        removeClass(divAddFlat, "is-disabled");
        removeClass(divAddDoubleFlat, "is-disabled");
    } else {
        removeClass(divHalfRest, "is-disabled");
        removeClass(divHalfNote, "is-disabled");
        removeClass(divQuarterNote, "is-disabled");
        removeClass(divQuarterRest, "is-disabled");
        removeClass(divEighthNote, "is-disabled");
        removeClass(divEighthRest, "is-disabled");

        addClass(divAddSharp, "is-disabled");
        addClass(divAddDoubleSharp, "is-disabled");
        addClass(divAddFlat, "is-disabled");
        addClass(divAddDoubleFlat, "is-disabled");
    }

    if (selectedNote) {
        selectedNote.setStyle({fillStyle: "Black", strokeStyle: "Black"});
        selectedNote = null;
        draw();
    }
}

function saveAlteredNoteInBars(modifier) {
    let octaveNumber = selectedNote.keys[0].split("/").pop();
    selectedNote.keys[0] = `${modifier}/${octaveNumber}`;
    selectedNote.modifiers = [];
    selectedNote.addAccidental(0, new VF.Accidental(modifier));
}

function checkIsRest() {
    return selectedNote.customTypes[0] === 'r' ? true : false;
}

function alterNote(evt) {
    if (selectedNote && !checkIsRest()) {
        if (evt.target.id === "add-sharp") {
            saveAlteredNoteInBars("#");
        } else if (evt.target.id === "add-flat") {
            saveAlteredNoteInBars("b");
        } else if (evt.target.id === "add-double-sharp") {
            saveAlteredNoteInBars("##");
        } else if (evt.target.id === "add-double-flat") {
            saveAlteredNoteInBars("bb");
        }
        recalculateBars();
        draw();
        console.log(bars)
    }
}

//TODO: add a button somewhere that will call this function to delete last bar (maybe in right panel)
function deleteLastBar() {
    delete bars[bars.length - 1];
}
