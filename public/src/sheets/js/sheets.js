// Local Storage only stores strings, so we need to convert the boolean to a string
if (localStorage.privateRepository == 'false') {
  console.log("public repository");
}
if (localStorage.privateRepository == 'true') {
  console.log("private repository");
}