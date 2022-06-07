carga()
async function carga() {

    var result = await fetch('http://localhost:9494/account')
    if(result.ok) {
        var user = await result.json();
        console.log(user)
    }
    localStorage.setItem("user_id",user.id_cuenta)
    
    localStorage.setItem("userName", user.nombre)
}