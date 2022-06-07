async function loadSheets() {
  let response;
  if (localStorage.getItem('privateRepository') == "true") {
    response = await fetch("/mysheets");
  } else {
    response = await fetch("/sheets");
  }
  if (response.ok) {
    const sheets = await response.json();
    document.querySelector(".container-smp-sheets").innerHTML =
      insertSheets({ sheets });
  } else {
    alert("Server found an issue, " + response.statusText);
  }
}

<<<<<<< HEAD
function sheetClicked(evt) {
  console.log(evt.target);
  const id = findSiblingIdUsingDom(evt.target, ".card", ".this-is-id");
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
=======

>>>>>>> 3530a98dc1c7972981ac0863c752e8909edcd7ad
