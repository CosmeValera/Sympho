var divSwitch = document.querySelector('.switch-automatic-add-bar');

function switchClicked(evt) {
    if (evt.target.checked) {
        console.log("checked");
        localStorage.setItem("automaticAddBar", true);
    } else {
        console.log("unchecked");
        localStorage.setItem("automaticAddBar", false);
    }
}

divSwitch.addEventListener('click', switchClicked);