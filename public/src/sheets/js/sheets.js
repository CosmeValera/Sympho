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