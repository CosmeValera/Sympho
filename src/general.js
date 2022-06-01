// console.log("general.js is loaded");
document.querySelector(".public-sheets")
  .addEventListener("click", function(evt) {
    evt.preventDefault();
    console.log("public repository");
    localStorage.setItem("privateRepository", false);
    window.location = "../sheets/sheets.html";
});

document.querySelector(".private-sheets")
  .addEventListener("click", function(evt) {
    evt.preventDefault();
  localStorage.setItem("privateRepository", true);
  console.log("private repository");
  window.location = "../sheets/sheets.html";
});