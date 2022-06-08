const mysheets = require('./dbMySheets.js')
const sheets = require('./dbSheets.js')

async function getAll(isPriv) {
    var dbResponse
    if (isPriv){
        dbResponse = await mysheets.findAll()
    }else {
        dbResponse = await sheets.findAll()
    }
    return dbResponse
}

async function getOne(id, isPriv) {
    var dbResponse
    if (isPriv) {
        dbResponse = await mysheets.findOne(id)
    }else {
        dbResponse = await sheets.findOne(id)
    }
    if (dbResponse) {
        return dbResponse
    } else {
        return null
    }

}

async function create(obj) {
    
    var sheetPriv
    if (!obj.isPriv) {
        var sheet
        sheet = await sheets.findOne(obj.id)
    }
    sheetPriv = await mysheets.findOne(obj.id)
    if (sheetPriv) {
        return null
    } else {
        if (!obj.isPriv) {
            await sheets.insertOne(obj)
        }
        return await mysheets.insertOne(obj)
        
    }

}

async function update(obj) {
    try {
        const dbResponse = await mysheets.updateOne(obj)
        return (dbResponse).modifiedCount == 1
    } catch (err) {
        return err
    }

}

async function deleteOne(id) {
    try {
        const dbResponse = await mysheets.deleteOne(id)
	    console.log(dbResponse.deletedCount)
        return dbResponse.deletedCount == 1
    } catch (error) {
        return error
    }
}




module.exports = {
    getAll, getOne, create, update, deleteOne
}
