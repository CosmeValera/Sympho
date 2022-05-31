const mongo = require('mongodb');
const mongoClient = mongo.MongoClient;
const MONGO_URI = process.env.MONGO_CONN 
    ? process.env.MONGO_CONN
    : "mongodb://localhost:27017/api"
const dbSheets = require('./dbSheets')

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
        const sheet = await sheets.findOne({"id":id.toString()})
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
        
        const respuesta = await sheets.insertOne({"id":obj.id.toString(),"nombre":obj.nombre.toString(), "value":obj.value.json()})
        if (respuesta) {
            if (obj.makePub) {
                dbSheets.insertOne(obj)
            }
            return respuesta
        }else {
            return null
        }
    }catch(err) {
        throw new Error("Couldn't connect to DB")
    }
}

async function updateOne(obj) {
    try { 
        const respuesta = await sheets.updateOne({"id":obj.id.toString()},{$set: {"nombre":obj.nombre.toString(),"value": obj.value.json()}})
        if (respuesta) {
            return respuesta
        }else {
            return null
        }    
    } catch (err) {
        throw new Error("Couldn't connect to DB")
    }
    
}

async function deleteOne(id) {
    try{
        const respuesta = await users.deleteOne({"id":id.toString()})
        return respuesta 
    }catch(err) {
        throw new Error("Couldn't connect to DB")
    }
}

module.exports = {findAll, findOne, insertOne, updateOne, deleteOne, conn}
function conn(userName) {
    mongoClient.connect(MONGO_URI, (err,db) => {
        if (err) throw err;
        sheets = db.db("api").collection(userName);
    })
}