async function loadSheets(word) {
  localStorage.removeItem("typeOfCompose");
  localStorage.removeItem("sheetData");
  let response;
  if (localStorage.getItem('privateRepository') == "true") {
    response = await fetch("/mysheets");
    if (response.ok) {
      var res = await fetch("http://34.175.197.150/sympho/mysheets")
      var sheets = await res.json();
      if (word) {
        const regex = new RegExp(word, "i");
        sheets = sheets.filter(sheet => regex.test(sheet.compositor) || regex.test(sheet.nombre) || regex.test(sheet.instrumento));
      }
      sheets = sheets.filter(sheet => sheet.compositor == localStorage.getItem('userName'));
      document.querySelector(".container-smp-sheets").innerHTML =
        insertMySheets({ sheets });
    } else {
      window.location = "http://localhost:9494/src/account/account.html"
    }
  } else {
    response = await fetch("/sheets");
    if (response.ok) {
      var res = await fetch("http://34.175.197.150/sympho/sheets")
      var sheets = await res.json();
      if (word) {
        const regex = new RegExp(word, "i");
        sheets = sheets.filter(sheet => regex.test(sheet.compositor) || regex.test(sheet.nombre) || regex.test(sheet.instrumento));
      }
      document.querySelector(".container-smp-sheets").innerHTML =
        insertSheets({ sheets });
    } else {
      window.location = "http://localhost:9494/src/account/account.html"
    }
  }
  
}

function filterSheets(evt) {
  console.log(evt.target.value);
  loadSheets(evt.target.value);
}


document.getElementById("filter").addEventListener("keyup", filterSheets);


async function sheetClicked(evt) {
  console.log(evt.target.dataset.type);
  const id = findSiblingIdUsingDom(evt.target, ".card", ".this-is-id");
  console.log(id);
  // debugger;
  if (evt.target.dataset.type === "remove") {
    console.log("hola")
    var res = await fetch(`http://34.175.197.150/mysheets/${id}`, {
      method: "DELETE"
    })
    if (res.ok) {
      console.log("buenas")
      var res = await fetch("http://34.175.197.150/sympho/mysheets")
      const sheets = await res.json();
      document.querySelector(".container-smp-sheets").innerHTML =
        insertMySheets({ sheets });
    } 
  } 
  if (evt.target.dataset.type === "edit") {
    var sheetData = await fetch(`http://34.175.197.150/sympho/mysheets/${id}`);
    if (sheetData.ok) {
      let sheetDataJson = await sheetData.json();
      localStorage.setItem('sheetData', JSON.stringify(sheetDataJson));
      localStorage.setItem('typeOfCompose', "edit");
      window.location = `http://localhost:9494/src/compose/compose.html`
    }
  }
  if (evt.target.dataset.type === "details") {
    var sheetData = await fetch(`http://34.175.197.150/sympho/sheets/${id}`);
    if (sheetData.ok) {
      let sheetDataJson = await sheetData.json();
      console.log(sheetDataJson);
      localStorage.setItem('sheetData', JSON.stringify(sheetDataJson));
      localStorage.setItem('typeOfCompose', "details");
      window.location = `http://localhost:9494/src/compose/compose.html`
    }
  }
}

function findSiblingIdUsingDom(actualElement, parentClass, siblingClass) {
  const parentDiv = actualElement.closest(parentClass);
  const divWithId = parentDiv.querySelector(siblingClass);
  const id = divWithId.innerHTML.trim();
  return id;
}

document.querySelector(".container-smp-sheets").addEventListener("click", sheetClicked);

loadSheets();
