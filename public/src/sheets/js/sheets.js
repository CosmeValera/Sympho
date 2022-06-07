
async function saveSheet(/*userName, sheetTitle, sheetData*/){
// Local Storage only stores strings, so we need to convert the boolean to a string
if (localStorage.privateRepository == 'false') {
  result = await fetch("http://localhost:9494/mysheets")
  if (result == 200) {
    console.log('fino')
  }
}
if (localStorage.privateRepository == 'true') {
  console.log("private repository");
}
}

module.exports = {saveSheet}
