const pug_body = document.getElementById("pug-body")

carga()
async function carga() {
    localStorage.typeOfCompose = "save";
    console.log(localStorage.user_id)
    var user    
    if (localStorage.user_id) {
        var result = await fetch('http://localhost:9494/account')
            if(result.ok) {
                user = await result.json();
                localStorage.setItem("user_id",user.id_cuenta)
                await fetch(`http://34.175.197.150/sympho/login/${localStorage.user_id}`)
                localStorage.setItem("userName", user.nombre)
            } 
        pug_body.innerHTML = loadAccount({"user":user})
        const logout_button = document.getElementById("logout-btn")
        logout_button.addEventListener("click", () => {
            localStorage.removeItem("user_id")
            localStorage.removeItem("userName")
        })
        
    }else {
        pug_body.innerHTML = '<a id="login-btn" class="btn btn-primary d-flex justify-content-center" href="http://localhost:9494/google/auth" role="button">Login with Google</a>'
        const login_button = document.getElementById("login-btn")
        login_button.addEventListener("click", async() =>{
            var result = await fetch('http://localhost:9494/account')
            if(result.ok) {
                user = await result.json();
                localStorage.setItem("user_id",user.id_cuenta)
                await fetch(`http://34.175.197.150/sympho/login/${localStorage.user_id}`)
                localStorage.setItem("userName", user.nombre)
            }
        })
    }

}
    