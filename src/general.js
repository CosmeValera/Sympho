// console.log("general.js is loaded");
document.querySelector(".public-sheets")
  .addEventListener("click", function() {
    localStorage.privateRepository = false;
    console.log("public repository");
});

document.querySelector(".private-sheets")
  .addEventListener("click", function() {
  localStorage.privateRepository = true;
    console.log("private repository");
});