function carga() {
    let sheet = "";
    if (localStorage.sheetData) {
        sheet = JSON.parse(localStorage.sheetData);
    }
    console.log(sheet);
    console.log(sheet.value);
    let typeOfCompose = localStorage.typeOfCompose;
    if (typeOfCompose == "edit") {
        scoreId = sheet._id;
        scoreName = sheet.nombre;
        instrument = sheet.instrumento ? sheet.instrumento : "Piano";
        document.querySelector(".form-group-save").classList.add("d-none");
        // document.querySelector("#type-of-score").classList.add("d-none");
        // modalSaveScore.dataset.id = "update"
    } else if (typeOfCompose == "details") {
        scoreId = sheet._id;
        scoreName = sheet.nombre;
        instrument = sheet.instrumento;
        modalSaveScore.classList.add("d-none");
        divTrash.classList.add("d-none");
        divAddBar.classList.add("d-none");
        // modalSaveScore.removeAttribute("id") ;
    } else {
        // modalSaveScore.dataset.id = "save"
    }

    notesSimplified = sheet.value;

    console.log("notesSimplified", notesSimplified);
    if (notesSimplified) {
        createBarsWithSimplifiedNotes();
    }
    if (!notesSimplified) {
        console.log("no notesSmiple");
        createNewBarFullOfSilences(0);
    }
}

function createBarsWithSimplifiedNotes() {
    let notesOfABar = [];
    let barBeats = 0;
    for (let noteSimpl of notesSimplified) {
        // We insert notes until having 4 beats
        let noteValue = 4 / noteSimpl.duration;
        barBeats += noteValue;
        if (noteSimpl.hasDot) {
            barBeats += noteValue/2;
        }
        notesOfABar.push(noteSimpl);
        if (barBeats == 4) {
            createNewBarWithSimplifiedNotes(notesOfABar);
            barBeats = 0;
            notesOfABar = [];
        }
    }
}

function createNewBarWithSimplifiedNotes(notesOfABar) {
    let barPos = BARS.length;
    let widthAndX = calculateWidthAndX(barPos);
    let heightAndY = calculateHeightAndY(barPos);

    let stave = createStave(barPos, widthAndX, heightAndY);
    let notes = [];
    for (let noteSimp of notesOfABar) {
        // new VF.StaveNote({ clef: "treble", keys: ["b/4"], duration: "4r" }),
        let noteStave;
        if (!noteSimp.hasDot || noteSimp.hasDot == false) {
            noteStave = new VF.StaveNote({
                clef: "treble",
                keys: [
                    noteSimp.pitch +
                        noteSimp.accidental +
                        "/" +
                        noteSimp.octave,
                ],
                duration: noteSimp.duration + (noteSimp.rest ? "r" : ""),
                auto_stem: true,
            });
        } else {
            noteStave = new VF.StaveNote({
                clef: "treble",
                keys: [
                    noteSimp.pitch +
                        noteSimp.accidental +
                        "/" +
                        noteSimp.octave,
                ],
                duration: noteSimp.duration + (noteSimp.rest ? "r" : ""),
                auto_stem: true,
                dots: 1,
            }).addDotToAll();
        }
        if (noteSimp.accidental) {
            noteStave.addAccidental(0, new VF.Accidental(noteSimp.accidental));
        }
        notes.push(noteStave);
    }

    BARS[barPos] = new Bar(stave, notes, widthAndX, heightAndY);
}

divSaveScore.addEventListener("click", saveScore);

class Bar {
    constructor(stave, notes, x, y) {
        this.stave = stave;
        this.notes = notes;
        this.x = x;
        this.y = y;
    }
}

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
    automaticAddBar = localStorage.getItem("automaticAddBar");
    leftMargin = getComputedStyle(document.querySelector("body"))
        .getPropertyValue("--margin-left")
        .slice(0, -2);
    rightMargin = getComputedStyle(document.querySelector("body"))
        .getPropertyValue("--margin-right")
        .slice(0, -2);
    setDivBpm();
}

function createNewBarFullOfSilences() {
    let barPos = BARS.length;
    let widthAndX = calculateWidthAndX(barPos);
    let heightAndY = calculateHeightAndY(barPos);

    let stave = createStave(barPos, widthAndX, heightAndY);
    let notes = [
        new VF.StaveNote({ clef: "treble", keys: ["b/4"], duration: "4r" }),
        new VF.StaveNote({ clef: "treble", keys: ["b/4"], duration: "4r" }),
        new VF.StaveNote({ clef: "treble", keys: ["b/4"], duration: "4r" }),
        new VF.StaveNote({ clef: "treble", keys: ["b/4"], duration: "4r" }),
    ];
    BARS[barPos] = new Bar(stave, notes, widthAndX, heightAndY);
}

function calculateWidthAndX(barPos) {
    if (BARS.length == 0) {
        //empty BARS
        return STAVE_MARGIN_LEFT;
    }
    let previousBar = getLastBar(barPos);

    //If it's 0 we are in first bar of row, and 1 means the second bar of row
    let widthAndXPositioner = barPos % amountOfBarsPerRow;
    if (widthAndXPositioner == 0) {
        return STAVE_MARGIN_LEFT;
    }
    return previousBar.stave.x + previousBar.stave.width;
}

function calculateHeightAndY(barPos) {
    if (BARS.length == 0) {
        //empty BARS
        return STAVE_MARGIN_TOP;
    }
    let heightAndYMultiplier = Math.floor(barPos / amountOfBarsPerRow);

    return STAVE_MARGIN_TOP + BAR_WIDTH * heightAndYMultiplier;
}

function getLastBar(posBarToCreate) {
    return BARS[posBarToCreate - 1];
}

function deleteFrom(notes, notePos) {
    notes.splice(notePos, 1);
    return notes;
}

function cloneNotes(notes) {
    return [...notes];
}

// function removeNote(notes, pos) {
//     let noteToRemove = notes[pos];
//     let noteToRemoveValue = 4/noteToRemove.duration;
//     let sum = 0;
//     for (let i = 0; i < notes.length; i++) {
//         sum += 4/notes[i].duration;
//         if (sum > noteToRemoveValue) {
//             notes.splice(i, 1);
//             return notes;
//         }
//     }
// }

// If true, the next note is removed

function deleteNextNoteIfSameDuration(notes, nextPos, nextNoteDuration) {
    if (nextPos < notes.length && notes[nextPos].duration == nextNoteDuration) {
        notes.splice(nextPos, 1);
        return true;
    }
    return false;
}

function deletePreviousNoteIfSameDuration(
    notes,
    previousPos,
    previouseNoteDuration
) {
    if (
        previousPos >= 0 &&
        notes[previousPos].duration == previouseNoteDuration
    ) {
        notes.splice(previousPos, 1);
        notePosInArray--;
        return true;
    }
    return false;
}

function getRowNumber() {
    return Math.floor((yPositionClick - STAVE_MARGIN_TOP) / BAR_WIDTH);
}

function getBarPosition() {
    if (xPositionClick < BAR_SIZE_WITH_MARGIN_X) {
        if (getRowNumber() === 0) {
            if (xPositionClick > STAVE_MARGIN_LEFT + CLEF_SIZE + TEMPO_SIZE) {
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
        ? BARS[barNumber]
        : undefined;
}

function calculateNote() {
    let yPosInAnyBar = Math.ceil(
        (((yPositionClick - STAVE_MARGIN_TOP) % BAR_WIDTH) - 18) / 5
    );
    if (yPosInAnyBar < 0 || yPosInAnyBar > 16) {
        return null;
    }

    for (const [position, note] of notesMap.entries()) {
        if (yPosInAnyBar <= position) {
            console.log(position, note);
            return note;
        }
    }
}

function calculatePosIf16Sixteenths() {
    if (xPositionClick <= BAR_SIZE_WITH_MARGIN_X) {
        if (getRowNumber() === 0) {
            if (
                xPositionClick >
                BAR_SIZE_WITH_MARGIN_X - SPACE_PER_NOTE * 1.5
            ) {
                return (MAX_AMOUNT_NOTES_IN_A_BAR - 1) / 4;
            }
        } else if (getRowNumber() !== 0) {
            if (
                xPositionClick >
                BAR_SIZE_WITH_MARGIN_X - SPACE_PER_NOTE * 2.5
            ) {
                return (MAX_AMOUNT_NOTES_IN_A_BAR - 1) / 4;
            }
        }
        return getRowNumber() === 0
            ? ((Math.trunc(
                  (xPositionClick - CLEF_SIZE - TEMPO_SIZE) / SPACE_PER_NOTE
              ) %
                  MAX_AMOUNT_NOTES_IN_A_BAR) -
                  1) /
                  4
            : ((Math.trunc(
                  (xPositionClick - STAVE_MARGIN_LEFT - TEMPO_SIZE) /
                      SPACE_PER_NOTE
              ) %
                  MAX_AMOUNT_NOTES_IN_A_BAR) -
                  1) /
                  4;
    } else if (xPositionClick > BAR_SIZE_WITH_MARGIN_X) {
        return (
            (Math.trunc(
                (xPositionClick - BAR_SIZE_WITH_MARGIN_X) / (SPACE_PER_NOTE + 1)
            ) %
                MAX_AMOUNT_NOTES_IN_A_BAR) /
            4
        );
    }
}

function calculateNotePosInArray(bar, fakePos) {
    let notes = bar.notes;
    let notesValues = notes.map((n) => 4 / n.duration);
    let sum = 0;
    for (let i = 0; i < notesValues.length; i++) {
        sum += notesValues[i];
        if (fakePos < sum) {
            notePosInArray = i;
            return;
        }
    }
}

function spliceNotes(bar, amountOfSplices) {
    for (let i = 0; i < amountOfSplices; i++) {
        bar.notes.splice(
            notePosInArray + 1,
            0,
            new VF.StaveNote({
                clef: "treble",
                keys: ["b/4"],
                duration: noteDuration + "r",
            })
        );
    }
}

function deleteNotes(bar, olderNoteDuration, amountOfNotesToDelete) {
    let tmpNotes = cloneNotes(bar.notes);
    for (let i = 0; i < amountOfNotesToDelete; i++) {
        if (
            deleteNextNoteIfSameDuration(
                tmpNotes,
                notePosInArray + 1,
                olderNoteDuration
            )
        ) {
            continue;
        }
        if (
            deletePreviousNoteIfSameDuration(
                tmpNotes,
                notePosInArray - 1,
                olderNoteDuration
            )
        ) {
            continue;
        }
        return null;
    }
    bar.notes = tmpNotes;
    return;
}

function newNoteValueIsSixteenTimesLess(bar) {
    spliceNotes(bar, 15);
}

function newNoteValueIsEightTimesLess(bar) {
    spliceNotes(bar, 7);
}

function newNoteValueIsFourTimesLess(bar) {
    spliceNotes(bar, 3);
}

function newNoteValueIsTwoTimesLess(bar) {
    spliceNotes(bar, 1);
}

function newNoteValueIsTwoTimesBigger(bar, olderNoteDuration) {
    if (deleteNotes(bar, olderNoteDuration, 1) === null) {
        return null;
    }
    return;
}

function newNoteValueIsFourTimesBigger(bar, olderNoteDuration) {
    if (deleteNotes(bar, olderNoteDuration, 3) === null) {
        return null;
    }
    return;
}

function newNoteValueIsEightTimesBigger(bar, olderNoteDuration) {
    if (deleteNotes(bar, olderNoteDuration, 7) === null) {
        return null;
    }
    return;
}

function newNoteValueIsSixteenTimesBigger(bar, olderNoteDuration) {
    if (deleteNotes(bar, olderNoteDuration, 15) === null) {
        return null;
    }
    return;
}

function alterBarNotesOverDotNotes(bar, newNoteValue, previousNoteValue) {
    console.log("Has dot");
    if (newNoteValue === previousNoteValue * 2) {
        if (
            notePosInArray < bar.notes.length - 1 &&
            4 / bar.notes[notePosInArray + 1].duration === previousNoteValue / 2
        ) {
            bar.notes.splice(notePosInArray + 1, 1);
            return true;
        }
    }
    if (newNoteValue === previousNoteValue) {
        bar.notes.splice(
            notePosInArray + 1,
            0,
            new VF.StaveNote({
                clef: "treble",
                keys: ["b/4"],
                duration: noteDuration * 2 + "r",
            })
        );
        return;
    }
    if (newNoteValue === previousNoteValue / 2) {
        bar.notes.splice(
            notePosInArray + 1,
            0,
            new VF.StaveNote({
                clef: "treble",
                keys: ["b/4"],
                duration: noteDuration + "r",
            })
        );
        return;
    }
    if (newNoteValue === previousNoteValue / 4) {
        bar.notes.splice(
            notePosInArray + 1,
            0,
            new VF.StaveNote({
                clef: "treble",
                keys: ["b/4"],
                duration: noteDuration + "r",
            })
        );
        bar.notes.splice(
            notePosInArray + 1,
            0,
            new VF.StaveNote({
                clef: "treble",
                keys: ["b/4"],
                duration: noteDuration + "r",
            })
        );
        return;
    }
    if (newNoteValue === previousNoteValue / 8) {
        bar.notes.splice(
            notePosInArray + 1,
            0,
            new VF.StaveNote({
                clef: "treble",
                keys: ["b/4"],
                duration: noteDuration + "r",
            })
        );
        bar.notes.splice(
            notePosInArray + 1,
            0,
            new VF.StaveNote({
                clef: "treble",
                keys: ["b/4"],
                duration: noteDuration + "r",
            })
        );
        bar.notes.splice(
            notePosInArray + 1,
            0,
            new VF.StaveNote({
                clef: "treble",
                keys: ["b/4"],
                duration: noteDuration + "r",
            })
        );
        bar.notes.splice(
            notePosInArray + 1,
            0,
            new VF.StaveNote({
                clef: "treble",
                keys: ["b/4"],
                duration: noteDuration + "r",
            })
        );
        return;
    }
    return null;
}

function alterBarNotes(bar) {
    let newNoteDuration = noteDuration;
    let olderNoteDuration = bar.notes[notePosInArray].duration;
    let newNoteValue = 4 / newNoteDuration;
    let previousNoteValue = 4 / olderNoteDuration;

    // check if older note has a dot
    if (checkIfHasDot(bar.notes[notePosInArray])) {
        let result = alterBarNotesOverDotNotes(
            bar,
            newNoteValue,
            previousNoteValue
        );
        if (result === null) {
            return null;
        }
        if (result === true) {
            return;
        }
    }

    if (newNoteValue == previousNoteValue / 16) {
        if (newNoteValueIsSixteenTimesLess(bar) === null) {
            return null;
        }
    }
    if (newNoteValue == previousNoteValue / 8) {
        if (newNoteValueIsEightTimesLess(bar) === null) {
            return null;
        }
    }
    if (newNoteValue == previousNoteValue / 4) {
        if (newNoteValueIsFourTimesLess(bar) === null) {
            return null;
        }
    }
    if (newNoteValue == previousNoteValue / 2) {
        if (newNoteValueIsTwoTimesLess(bar) === null) {
            return null;
        }
    }
    if (newNoteValue == previousNoteValue * 2) {
        if (newNoteValueIsTwoTimesBigger(bar, olderNoteDuration) === null) {
            return null;
        }
    }
    if (newNoteValue == previousNoteValue * 4) {
        if (newNoteValueIsFourTimesBigger(bar, olderNoteDuration) === null) {
            return null;
        }
    }
    if (newNoteValue == previousNoteValue * 8) {
        if (newNoteValueIsEightTimesBigger(bar, olderNoteDuration) === null) {
            return null;
        }
    }
    if (newNoteValue == previousNoteValue * 16) {
        if (newNoteValueIsSixteenTimesBigger(bar, olderNoteDuration) === null) {
            return null;
        }
    }
}

function addNewNote() {
    let bar = calculateBar();
    let note = calculateNote();
    let fakePos = calculatePosIf16Sixteenths();
    if (!note || !bar) return;
    calculateNotePosInArray(bar, fakePos);

    if (alterBarNotes(bar) === null) {
        return;
    }

    let newNoteDuration = noteDuration + (isRest ? "r" : "");
    console.log(notePosInArray);
    console.log(BARS);

    bar.notes[notePosInArray] = new VF.StaveNote({
        clef: "treble",
        keys: note,
        duration: newNoteDuration,
        auto_stem: true,
    });
}

function selectNote() {
    let bar = calculateBar();
    let note = calculateNote();
    let fakePos = calculatePosIf16Sixteenths();
    if (!note || !bar) return;
    calculateNotePosInArray(bar, fakePos);

    if (selectedNote) {
        selectedNote.setStyle({ fillStyle: "Black", strokeStyle: "Black" });
    }
    selectedNote = bar.notes[notePosInArray];
    selectedNote.setStyle({
        fillStyle: "MediumBlue",
        strokeStyle: "MediumBlue",
    });
}

function alterBarNotesDot(bar) {
    if (notePosInArray == bar.notes.length - 1) {
        return null;
    }

    // selectedNote === bar.notes[notePosInArray]
    let thisNoteDurationWithoutDot = bar.notes[notePosInArray].duration;
    let nextNoteDuration = bar.notes[notePosInArray + 1].duration;
    let thisNoteValueWithoutDot = 4 / thisNoteDurationWithoutDot;
    let nextNoteValue = 4 / nextNoteDuration;

    if (notePosInArray < bar.notes.length - 1) {
        if (
            bar.notes[notePosInArray].dots ||
            bar.notes[notePosInArray + 1].dots
        ) {
            return null;
        }

        if (nextNoteValue == thisNoteValueWithoutDot / 2) {
            bar.notes.splice(notePosInArray + 1, 1);
            return;
        } else if (nextNoteValue == thisNoteValueWithoutDot) {
            bar.notes.splice(notePosInArray + 1, 1);
            bar.notes.splice(
                notePosInArray + 1,
                0,
                new VF.StaveNote({
                    clef: "treble",
                    keys: ["b/4"],
                    duration: selectedNote.duration * 2 + "r",
                })
            );
            return;
        }
    }
    if (notePosInArray < bar.notes.length - 2) {
        let nextNextNoteDuration = bar.notes[notePosInArray + 2].duration;
        let nextNextNoteValue = 4 / nextNextNoteDuration;
        if (bar.notes[notePosInArray + 2].dots) {
            return null;
        }

        if (nextNoteValue + nextNextNoteValue == thisNoteValueWithoutDot / 2) {
            bar.notes.splice(notePosInArray + 1, 1);
            bar.notes.splice(notePosInArray + 1, 1);
            return;
        }
    }
    return null;
}

function addDot() {
    if (selectedNote) {
        let bar = calculateBar();
        let fakePos = calculatePosIf16Sixteenths();
        calculateNotePosInArray(bar, fakePos);

        if (alterBarNotesDot(bar) === null) {
            return;
        }

        // DONT USE noteDuration, use selectedNote.duration
        let newNoteDuration = selectedNote.duration + (isRest ? "r" : "") + "d";
        bar.notes[notePosInArray] = new VF.StaveNote({
            clef: "treble",
            keys: bar.notes[notePosInArray].keys,
            duration: newNoteDuration,
            dots: 1,
            auto_stem: true,
        }).addDotToAll();
        let accidental = selectedNote.keys[0].split("/")[0].substring(1);
        console.log(accidental);
        if (accidental) {
            saveAlteredNoteInBars(accidental);
            bar.notes[notePosInArray].addAccidental(
                0,
                new VF.Accidental(accidental)
            );
        }

        selectNote();
        recalculateBars();
        draw();
        console.log(BARS);
    }
}

// These 2 functinos are not done yet
function addTriplet() {
    if (selectedNote) {
        console.log("TO IMPLEMENT: add triplet");
    }
    console.log("always showing when click addTriplet");
}
function addTie() {
    if (selectedNote) {
        console.log("TO IMPLEMENT: add tie");
    }
    console.log("always showing when click addTie");
}

function lastBarHasOneNote(lastBar) {
    return BARS[lastBar].notes.some((n) => {
        if (!(n.customTypes[0][0] === "r")) {
            return true;
        }
    });
}

function recalculateBars() {
    for (let barPos = 0; barPos < BARS.length; barPos++) {
        let widthAndX = calculateWidthAndX(barPos);
        let heightAndY = calculateHeightAndY(barPos);
        let stave = createStave(barPos, widthAndX, heightAndY);
        let notes = BARS[barPos].notes;
        let x = widthAndX;
        let y = heightAndY;

        let barRecalculated = new Bar(stave, notes, x, y);
        BARS[barPos] = barRecalculated;
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
        addClass(divWholeNote, "is-disabled");
        addClass(divWholeRest, "is-disabled");
        addClass(divHalfNote, "is-disabled");
        addClass(divHalfRest, "is-disabled");
        addClass(divQuarterNote, "is-disabled");
        addClass(divQuarterRest, "is-disabled");
        addClass(divEighthNote, "is-disabled");
        addClass(divEighthRest, "is-disabled");
        addClass(divSixteenthNote, "is-disabled");
        addClass(divSixteenthRest, "is-disabled");

        removeClass(divAddSharp, "is-disabled");
        removeClass(divAddDoubleSharp, "is-disabled");
        removeClass(divAddFlat, "is-disabled");
        removeClass(divAddDoubleFlat, "is-disabled");
        removeClass(divAddDot, "is-disabled");
        removeClass(divAddTriplet, "is-disabled");
        removeClass(divAddTie, "is-disabled");
    } else {
        removeClass(divWholeNote, "is-disabled");
        removeClass(divWholeRest, "is-disabled");
        removeClass(divHalfRest, "is-disabled");
        removeClass(divHalfNote, "is-disabled");
        removeClass(divQuarterNote, "is-disabled");
        removeClass(divQuarterRest, "is-disabled");
        removeClass(divEighthNote, "is-disabled");
        removeClass(divEighthRest, "is-disabled");
        removeClass(divSixteenthNote, "is-disabled");
        removeClass(divSixteenthRest, "is-disabled");

        addClass(divAddSharp, "is-disabled");
        addClass(divAddDoubleSharp, "is-disabled");
        addClass(divAddFlat, "is-disabled");
        addClass(divAddDoubleFlat, "is-disabled");
        addClass(divAddDot, "is-disabled");
        addClass(divAddTriplet, "is-disabled");
        addClass(divAddTie, "is-disabled");
    }

    if (selectedNote) {
        selectedNote.setStyle({ fillStyle: "Black", strokeStyle: "Black" });
        selectedNote = null;
        draw();
    }
}

function checkIfHasDot(note) {
    if (!note) return false;
    for (let modifier of note.modifiers) {
        if (modifier && modifier.attrs.type && modifier.attrs.type === "Dot") {
            return true;
        }
    }

    return false;
}

function saveAlteredNoteInBars(accidental) {
    let hasDot = false;
    console.log(selectedNote.modifiers);
    if (selectedNote.modifiers[0] && checkIfHasDot(selectedNote)) {
        hasDot = true;
    }
    let octaveNumber = selectedNote.keys[0].split("/").pop();
    let pitch = selectedNote.keys[0].split("/")[0].substring(0, 1);

    selectedNote.keys[0] = `${pitch}${accidental}/${octaveNumber}`;
    selectedNote.modifiers = [];
    selectedNote.addAccidental(0, new VF.Accidental(accidental));
    if (hasDot) {
        selectedNote.addDotToAll();
    }
}

function checkIsRest() {
    return selectedNote.customTypes[0] === "r" ? true : false;
}

function alterNoteWithAccidental(evt) {
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
        console.log(BARS);
    }
}

function setDivBpm() {
    divBpm.innerHTML = `
    <img
        src="../../icons/4_note.png"
        alt="quarter"
    /> = ${bpm}`;
}

function changeSignature() {
    let timeSignature_beats_per_bar = timeSignature.split("/")[0];
    let timeSignature_beat_value = timeSignature.split("/")[1];
    if (
        timeSignature_beats_per_bar != beats_per_bar ||
        timeSignature_beat_value != beat_value
    ) {
        beats_per_bar = timeSignature_beats_per_bar;
        beat_value = timeSignature_beat_value;
    }
}

function deleteLastBar() {
    if (BARS.length > 1) {
        BARS.pop();
    }
    recalculateBars();
    draw();
}

function addLastBar() {
    createNewBarFullOfSilences();
    recalculateBars();
    draw();
}

function openSettings() {
    modalForSettings.show();
    modalForSettings._dialog.querySelector("#score-name").value = scoreName;
    modalForSettings._dialog.querySelector("#time-signature").value =
        timeSignature;
    modalForSettings._dialog.querySelector("#instrument").value =
        instrument.charAt(0).toUpperCase() + instrument.slice(1);
    modalForSettings._dialog.querySelector("#bpm").value = bpm;
}

function saveSettings() {
    scoreName = modalForSettings._dialog.querySelector("#score-name").value;
    instrument = modalForSettings._dialog
        .querySelector("#instrument")
        .value.toLowerCase();
    keySignature =
        modalForSettings._dialog.querySelector("#key-signature").value;
    timeSignature =
        modalForSettings._dialog.querySelector("#time-signature").value;
    bpm = modalForSettings._dialog.querySelector("#bpm").value;
    automaticAddBar = localStorage.getItem("automaticAddBar");

    changeSignature(timeSignature);
    setDivBpm();

    recalculateBars();
    draw();
    modalForSettings.hide();
}

function openSaveScore() {
    modalForSaveScore.show();
    // modal._dialog.querySelector("#score-name").value = scoreName;
}

async function saveScore(evt) {
    // TODO: link to api
    var isPublic =
        modalForSaveScore._dialog.querySelector("#type-of-score").value;
    let typeOfCompose = localStorage.typeOfCompose;
    calculateNotes();
    if (typeOfCompose == "details") {
        return;
    } else if (typeOfCompose == "edit") {
        localStorage.typeOfCompose = "save";
        var res = await fetch("/mysheets");
        if (res.ok) {
            var sheet = {
                nombre: scoreName,
                compositor: localStorage.userName,
                instrumento: instrument,
                value: notesSimplified,
                isPriv: true,
            };
            await fetch(`http://34.175.197.150/sympho/mysheets/${scoreId}`, {
                method: "PUT",
                headers: {
                    "Content-type": "application/json",
                },
                body: JSON.stringify(sheet),
            });
        } else {
            localStorage.typeOfCompose = "save";
            window.location = "http://localhost:9494/src/account/account.html";
        }
    }
    // This is normal case jsut upload the score
    localStorage.typeOfCompose = "save";
    if (isPublic === "Public") {
        var res = await fetch("http://localhost:9494/sheets");
        if (res.ok) {
            var sheet = {
                nombre: scoreName,
                compositor: localStorage.userName,
                instrumento: instrument,
                value: notesSimplified,
                isPriv: false,
            };
            await fetch("http://34.175.197.150/sympho/sheets", {
                method: "POST",
                headers: {
                    "Content-type": "application/json",
                },
                body: JSON.stringify(sheet),
            });
        } else {
            window.location = "http://localhost:9494/src/account/account.html";
        }
    } else {
        var res = await fetch("/sheets");
        if (res.ok) {
            var sheet = {
                nombre: scoreName,
                compositor: localStorage.userName,
                instrumento: instrument,
                value: notesSimplified,
                isPriv: true,
            };
            await fetch("http://34.175.197.150/sympho/sheets", {
                method: "POST",
                headers: {
                    "Content-type": "application/json",
                },
                body: JSON.stringify(sheet),
            });
        } else {
            localStorage.typeOfCompose = "save";
            window.location = "http://localhost:9494/src/account/account.html";
        }
    }
    localStorage.typeOfCompose = "save";
    modalForSaveScore.hide();
}

function divStaveScrolled(evt) {
    if (evt.target.scrollTop === 0) {
        // Show divBpm
        divBpm.style.display = "block";
    } else if (evt.target.scrollTop !== 0) {
        // Hide divBpm
        divBpm.style.display = "none";
    }
}

function switchClicked(evt) {
    if (evt.target.checked) {
        console.log("checked automaticAddBar");
        localStorage.setItem("automaticAddBar", true);
    } else {
        console.log("unchecked automaticAddBar");
        localStorage.setItem("automaticAddBar", false);
    }
}

function openDivOptions() {
    if (window.innerWidth <= 440) {
        divOptions.classList.add("div-options-mobile");
        divOptions
            .querySelectorAll("*")
            .forEach((e) => e.classList.remove("children-display-none"));
        toggleHamburguer = false;
    }
}

function closeDivOptions() {
    if (window.innerWidth <= 440) {
        divOptions.classList.remove("div-options-mobile");
        divOptions
            .querySelectorAll("*")
            .forEach((e) => e.classList.add("children-display-none"));
        toggleHamburguer = true;
    }
}

function toggleDivOptions() {
    if (toggleHamburguer) {
        openDivOptions();
    } else {
        closeDivOptions();
    }
}

function loadScore(evt) {
    // TODO: link to api
    console.log("load score");
}
