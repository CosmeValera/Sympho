var position;
var myElement;

// Helper function to get an element's exact position
function getTopLeftCornerPosition(el) {
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
    x: xPos,
    y: yPos
  };
}
 
function getRelativePosition(evt) {
  var xPosition = evt.clientX + myElement.scrollLeft - position.x;
  var yPosition = evt.clientY + myElement.scrollTop - position.y;
  console.log("Relative position:", xPosition, yPosition)
  // console.log("clientX:", evt.clientX, ".clientY:", evt.clientY,
  // ".scrollHeight:", myElement.scrollHeight, ".scrollTop:", myElement.scrollTop,
  // ".scrollLeft:", myElement.scrollLeft,
  // ".scrollY:", myElement.yScroll)
}
// deal with the page getting resized or scrolled
window.addEventListener("scroll", updatePosition, false);
window.addEventListener("resize", updatePosition, false);
 
function updatePosition() {
  // add your code to update the position when your browser
  // is resized or scrolled
  console.log("Hald")
  console.log(window.getComputedStyle(element).overflowY === 'visible')
}

function updatePosition() {
  position = getTopLeftCornerPosition(myElement);
  // console.log(position.x, position.y)
}       

position = getTopLeftCornerPosition(myElement);
myElement = document.querySelector("#content-section"); 
myElement.addEventListener("click", getRelativePosition);
// alert("The image is located at: " + position.x + ", " + position.y);
