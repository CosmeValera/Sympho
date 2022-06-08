const mongo = require('mongodb');
const mongoClient = mongo.MongoClient;
const MONGO_URI = process.env.MONGO_CONN 
    ? process.env.MONGO_CONN
    : "mongodb://localhost:27017/api"

var sheets

async function findAll() {
    
    try {
        return await sheets.find().toArray()    
    } catch (err) {
        throw new Error("Couldn't connect to DB")
    }
    
}

async function findOne(id) {
    try {
       
        const sheet = await sheets.findOne({"_id":mongo.ObjectId(id)})
        if (sheet) {
            return sheet
        }else {
            return null
        }    
        
        
    }catch(err) {
        throw new Error("Couldn't connect to DB")
    }
}

async function insertOne(obj) {
    try {
        
        const respuesta = await sheets.insertOne({"nombre":obj.nombre.toString(), "value":obj.value, "compositor":obj.compositor.toString(), "instrumento": obj.instrumento.toString()})
        if (respuesta) {
            return respuesta
        }else {
            return null
        }
    }catch(err) {
        throw new Error("Couldn't connect to DB")
    }
}

module.exports = {findAll, findOne, insertOne, conn}
function conn() {
    mongoClient.connect(MONGO_URI, (err,db) => {
        if (err) throw err;
        sheets = db.db("api").collection("sheets");
    })
}