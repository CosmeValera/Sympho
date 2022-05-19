let distanceStaveAndWindow;
let myStave;
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
    x: xPos + myStave.scrollLeft,
    y: yPos + myStave.scrollTop 
  };
}
 
function updatePosition() {
  distanceStaveAndWindow = getDistanceBetweenStaveAndWindow(myStave);
}       

function getRelativePosition(evt) {
  xPositionClick = evt.clientX + myStave.scrollLeft - distanceStaveAndWindow.x;
  yPositionClick = evt.clientY + myStave.scrollTop - distanceStaveAndWindow.y;
}

// deal with the page getting resized or scrolled
window.addEventListener("scroll", updatePosition);
window.addEventListener("resize", updatePosition);

myStave = document.querySelector("#content-section"); 
myStave.addEventListener("click", getRelativePosition);

distanceStaveAndWindow = getDistanceBetweenStaveAndWindow(myStave);
updatePosition();