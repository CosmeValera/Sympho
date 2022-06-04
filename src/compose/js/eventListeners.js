// PLAY
divPlay.addEventListener("click", play);
divStop.addEventListener("click", stopMusic);

// CLICK
window.addEventListener("scroll", updatePosition);
window.addEventListener("resize", updatePosition);

// LOGIC
mySectionStave.addEventListener("click", divStaveClicked);
mySectionStave.addEventListener("scroll", divStaveScrolled);
window.addEventListener("resize", windowSizeChanged);
divMouseToggle.addEventListener("click", mouseToggle);

divWholeNote.addEventListener("click", () => {
    if (!isMouseToggled) {
        isRest = false;
        noteDuration = 1;
    }
});
divWholeRest.addEventListener("click", () => {
    if (!isMouseToggled) {
        isRest = true;
        noteDuration = 1;
    }
});
divHalfNote.addEventListener("click", () => {
    if (!isMouseToggled) {
        isRest = false;
        noteDuration = 2;
    }
});
divHalfRest.addEventListener("click", () => {
    if (!isMouseToggled) {
        isRest = true;
        noteDuration = 2;
    }
});
divQuarterNote.addEventListener("click", () => {
    if (!isMouseToggled) {
        isRest = false;
        noteDuration = 4;
    }
});
divQuarterRest.addEventListener("click", () => {
    if (!isMouseToggled) {
        isRest = true;
        noteDuration = 4;
    }
});
divEighthNote.addEventListener("click", () => {
    if (!isMouseToggled) {
        isRest = false;
        noteDuration = 8;
    }
});
divEighthRest.addEventListener("click", () => {
    if (!isMouseToggled) {
        isRest = true;
        noteDuration = 8;
    }
});
divSixteenthNote.addEventListener("click", () => {
    if (!isMouseToggled) {
        isRest = false;
        noteDuration = 16;
    }
});
divSixteenthRest.addEventListener("click", () => {
    if (!isMouseToggled) {
        isRest = true;
        noteDuration = 16;
    }
});

divAddSharp.addEventListener("click", alterNoteWithAccidental);
divAddFlat.addEventListener("click", alterNoteWithAccidental);
divAddDoubleSharp.addEventListener("click", alterNoteWithAccidental);
divAddDoubleFlat.addEventListener("click", alterNoteWithAccidental);
divAddDot.addEventListener("click", addDot);
divAddTriplet.addEventListener("click", addTriplet);
divAddTie.addEventListener("click", addTie);

divSettings.addEventListener("click", openSettings)
divBtnSave.addEventListener("click", saveSettings);
divTrash.addEventListener("click", deleteLastBar);