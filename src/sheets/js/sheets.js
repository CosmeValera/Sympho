if (localStorage.privateRepository === true) {
  console.log("private repository");
} else if (localStorage.privateRepository === false) {
  console.log("public repository");
} else {
  console.log("unknown/undefined repository");
}