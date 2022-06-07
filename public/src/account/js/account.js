carga()
async function carga() {

    var result = await fetch('http://localhost:9494/account')
    if(result.ok) {
        var user = await result.json();
        localStorage.setItem("user_id",user.id_cuenta)
        await fetch(`http://34.175.197.150/sympho/login/${localStorage.user_id}`)
        localStorage.setItem("userName", user.nombre)
    }
}
    