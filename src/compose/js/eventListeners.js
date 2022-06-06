// PLAY
divPlay.addEventListener("click", togglePlay);

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
divAddBar.addEventListener("click", addLastBar);
divTrash.addEventListener("click", deleteLastBar);
divSaveScore.addEventListener("click", saveScore);
divSwitch.addEventListener('click', switchClicked);

divSettings.addEventListener("mouseover", ()=>{divSettings.classList.add("btn-info")});
divSettings.addEventListener("mouseout", ()=>{divSettings.classList.remove("btn-info")});
divAddBar.addEventListener("mouseover", ()=>{divAddBar.classList.add("btn-success")});
divAddBar.addEventListener("mouseout", ()=>{divAddBar.classList.remove("btn-success")});
divTrash.addEventListener("mouseover", ()=>{divTrash.classList.add("btn-danger")});
divTrash.addEventListener("mouseout", ()=>{divTrash.classList.remove("btn-danger")});
divSaveScore.addEventListener("mouseover", ()=>{divSaveScore.classList.add("btn-warning")});
divSaveScore.addEventListener("mouseout", ()=>{divSaveScore.classList.remove("btn-warning")});

divHamburger.addEventListener("click", ()=>{
    toggleDivOptions();
});

divStave.addEventListener("click", ()=>{
    closeDivOptions();
});
divToolbarSmp.addEventListener("click", ()=>{
    closeDivOptions();
});
divBpm.addEventListener("click", ()=>{
    closeDivOptions();
});