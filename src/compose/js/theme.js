const themeMap = {
    dark: "light",
    light: "solar",
    solar: "dark",
};

//After the '||' operator there is a comma operator sequence, it is a list of expressions separated by commas and the variable theme takes the value of the last expression in the list
const theme = localStorage.getItem("theme") ||
    ((tmp = Object.keys(themeMap)[0]), localStorage.setItem("theme", tmp), tmp);

const bodyClass = document.body.classList;
bodyClass.add(theme);

function toggleTheme() {
  const current = localStorage.getItem('theme');
  const next = themeMap[current];

  bodyClass.replace(current, next);
  localStorage.setItem('theme', next);
}

document.getElementById('themeButton').addEventListener('click', toggleTheme);