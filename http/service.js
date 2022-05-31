const users = require('./dbUsers.js')
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
    var sheet
    if (obj.isPriv) {
        sheet = await mysheets.findOne(obj.id)
    }else {
        sheet = await sheets.findOne(obj.id)
    }
    if (sheet) {
        return null
    } else {
        if (obj.isPriv) {
            return await mysheets.insertOne(obj)
        }else {
            return await sheets.insertOne(obj)
        }
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
        return dbResponse.deletedCount == 1
    } catch (error) {
        return error
    }
}

async function login(id, obj) {
    try {
        const dbResponse = await users.findOne(id, obj)
        if (dbResponse) {
            return dbResponse
        } else {
            return null
        }
    } catch (error) {
        return error
    }
}

async function register(obj) {
    const user = users.findOne(obj.id)
    if (user) {
        return null
    }else {
        return users.insertOne(obj)
    }
}

module.exports = {
    getAll, getOne, create, update, deleteOne, login, register
}