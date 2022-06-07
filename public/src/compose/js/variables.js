// Get element
const VF = Vex.Flow;
const divStave = document.getElementById("my-stave");
const renderer = new VF.Renderer(divStave, VF.Renderer.Backends.SVG);
const context = renderer.getContext();
const divWholeNote = document.getElementById("add-whole-note");
const divWholeRest = document.getElementById("add-whole-rest");
const divHalfNote = document.getElementById("add-half-note");
const divHalfRest = document.getElementById("add-half-rest");
const divQuarterNote = document.getElementById("add-quarter-note");
const divQuarterRest = document.getElementById("add-quarter-rest");
const divEighthNote = document.getElementById("add-eighth-note");
const divEighthRest = document.getElementById("add-eighth-rest");
const divSixteenthNote = document.getElementById("add-sixteenth-note");
const divSixteenthRest = document.getElementById("add-sixteenth-rest");
const divMouseToggle = document.getElementById("mouse-toggle");
const divAddSharp = document.getElementById("add-sharp");
const divAddFlat = document.getElementById("add-flat");
const divAddDoubleSharp = document.getElementById("add-double-sharp");
const divAddDoubleFlat = document.getElementById("add-double-flat");
const divAddTie = document.getElementById("add-tie");
const divAddDot = document.getElementById("add-dot");
const divAddTriplet = document.getElementById("add-triplet");
const divPlay = document.getElementById("btn-play");
const divTrash = document.getElementById("btn-trash");
const divAddBar = document.getElementById("btn-add-bar");

const modalSaveScore = document.getElementById("btn-open-save-score");
const divSaveScore = document.getElementById("btn-save-score");
const modalSettings = document.getElementById("btn-settings");
const divBtnSaveSettings = document.getElementById("btn-save-settings");
const divBpm = document.querySelector(".bpm");
const modalForSettings = new bootstrap.Modal(document.querySelector(".modal-settings"), {});
const modalForSaveScore = new bootstrap.Modal(document.querySelector(".modal-save-score"), {});
const divSwitch = document.querySelector('.switch-automatic-add-bar');
const divOptions = document.querySelector('.options-bar-smp');
const divHamburger = document.querySelector('.hamburger');
const divToolbarSmp = document.querySelector('.toolbar-smp');
// END: Get element

const BAR_SIZE_CLEF = 280;
const BAR_SIZE = 230;
const BAR_WIDTH = 100;
const STAVE_MARGIN_LEFT = 20;
const STAVE_MARGIN_TOP = 30;
const BAR_SIZE_WITH_MARGIN_X = BAR_SIZE_CLEF + STAVE_MARGIN_LEFT;
const BAR_WIDTH_WITH_MARGIN_Y = BAR_WIDTH +  STAVE_MARGIN_TOP;
const CLEF_SIZE = 30;
const TEMPO_SIZE = 30;
const SPACE_PER_NOTE = 55 / 4;
const MAX_AMOUNT_NOTES_IN_A_BAR = 16;
const EXTRA_RENDERER_SPACE = 30;
var BARS = [];

// var automaticAddBar = true;
var beats_per_bar = 4;
var beat_value = 4;
var timeSignature = "4/4";
var keySignature = "C";
var bpm = 100;
var instrument = "piano";
var scoreName = "";
var composerName = "";
var notePosInArray;
var noteDuration;
var isRest;
var isMouseToggled;
var selectedNote;
var rendererWidth;
var rendererHeight;
var amountOfBarsPerRow;
var leftMargin = 0;
var rightMargin = 0;
var isPlayingNow = false;
var delay = 0;
var timeoutId;
var toggleHamburguer = true;


var notesMap = new Map([
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
