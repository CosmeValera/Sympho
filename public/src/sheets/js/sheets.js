async function loadSheets(word) {
  let response;
  if (localStorage.getItem('privateRepository') == "true") {
    response = await fetch("/mysheets");
    if (response.ok) {
      var res = await fetch("http://34.175.197.150/sympho/mysheets")
      var sheets = await res.json();
      if (word) {
        const regex = new RegExp(word, "i");
        sheets = sheets.filter(sheet => regex.test(sheet.name));
      }
      document.querySelector(".container-smp-sheets").innerHTML =
        insertMySheets({ sheets });
    } else {
      window.location = "http://localhost:9494/src/account/account.html"
    }
  } else {
    response = await fetch("/sheets");
    if (response.ok) {
      var res = await fetch("http://34.175.197.150/sympho/sheets")
      const sheets = await res.json();
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
  console.log(evt.target);
  const id = findSiblingIdUsingDom(evt.target, ".card", ".this-is-id");
  if (evt.target.dataset.type === "remove") {
    console.log("hola")
    var res = await fetch(`http://localhost:9495/mysheets/629fab60a669afa237788728`, {
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
  console.log(evt.target.dataset.type);
  console.log(id);

  // TODO Fetch sheet from server
}

function findSiblingIdUsingDom(actualElement, parentClass, siblingClass) {
  const parentDiv = actualElement.closest(parentClass);
  const divWithId = parentDiv.querySelector(siblingClass);
  const id = divWithId.innerHTML.trim();
  return id;
}

document.querySelector(".container-smp-sheets").addEventListener("click", sheetClicked);

loadSheets();
