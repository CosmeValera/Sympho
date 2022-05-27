//const db = require('./db.js')

async function getAll() {

    const dbResponse = await db.findAll()
    return dbResponse


}

async function getOne(id) {

    const dbResponse = await db.findOne(id)

    if (dbResponse) {
        return dbResponse
    } else {
        return null
    }

}

async function create(obj) {

    const user = await db.findOne(obj.id)
    if (user) {
        return null
    } else {
        return await db.insertOne(obj)
    }

}

async function update(obj) {
    try {
        const dbResponse = await db.updateOne(obj)
        return (dbResponse).modifiedCount == 1
    } catch (err) {
        return err
    }

}

async function deleteOne(id) {
    try {
        const dbResponse = await db.deleteOne(id)
        return dbResponse.deletedCount == 1
    } catch (error) {
        return error
    }


}

module.exports = {
    getAll, getOne, create, update, deleteOne
}