let distanceStaveAndWindow;
let mySectionStave;
let xPositionClick;
let yPositionClick;

// Helper function to get an element's exact position
function getDistanceBetweenStaveAndWindow(el) {
  var xPos = 0;
  var yPos = 0;
 
  while (el) {
    if (el.tagName == "BODY") {
      // deal with browser quirks with body/window/document and page scroll
      var xScroll = el.scrollLeft || document.documentElement.scrollLeft;
      var yScroll = el.scrollTop || document.documentElement.scrollTop;
 
      xPos += (el.offsetLeft - xScroll + el.clientLeft);
      yPos += (el.offsetTop - yScroll + el.clientTop);
    } else {
      // for all other non-BODY elements
      xPos += (el.offsetLeft - el.scrollLeft + el.clientLeft);
      yPos += (el.offsetTop - el.scrollTop + el.clientTop);
    }
 
    el = el.offsetParent;
  }
  return {
    //we need to add scrollTop, otherwise it would be affecting twice
    x: xPos + mySectionStave.scrollLeft,
    y: yPos + mySectionStave.scrollTop 
  };
}
 
function updatePosition() {
  distanceStaveAndWindow = getDistanceBetweenStaveAndWindow(mySectionStave);
}       

function getRelativePosition(evt) {
  xPositionClick = evt.clientX + mySectionStave.scrollLeft - distanceStaveAndWindow.x;
  yPositionClick = evt.clientY + mySectionStave.scrollTop - distanceStaveAndWindow.y;
  // console.log("Relative position:", xPositionClick, yPositionClick);
}

// deal with the page getting resized or scrolled
window.addEventListener("scroll", updatePosition);
window.addEventListener("resize", updatePosition);

mySectionStave = document.querySelector("#section-my-stave"); 

distanceStaveAndWindow = getDistanceBetweenStaveAndWindow(mySectionStave);
updatePosition();