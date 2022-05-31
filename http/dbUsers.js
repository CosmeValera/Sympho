const mongo = require('mongodb');
const mongoClient = mongo.MongoClient;
const MONGO_URI = process.env.MONGO_CONN 
    ? process.env.MONGO_CONN
    : "mongodb://localhost:27017/api"
const dbMySheets = require('./dbMySheets')
var users
var regex = new RegExp("\d*")

async function login(nombre, obj) {
    try { 
        const user = await users.findOne({"nombre":nombre.toString()})
        if (user) {
            if (user.pass == obj.pass) {
                dbMySheets.conn(user.nombre)
                return 0
            } else {
                return 1
            }
        }else {
            return 2
        }    
    }catch(err) {
        throw new Error("Couldn't connect to DB")
    }
}

async function register(obj) {
    try {
        const respuesta = await users.insertOne({"nombre":obj.nombre.toString(), "pass":obj.pass.toString()})
        if (respuesta) {
            return respuesta
        }else {
            return null
        }
    }catch(err) {
        throw new Error("Couldn't connect to DB")
    }
}


module.exports = {login, register, conn}
function conn() {
    mongoClient.connect(MONGO_URI, (err,db) => {
        if (err) throw err;
        sheets = db.db("api").collection("users");
    })
}