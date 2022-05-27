const service = require('./service')

async function getController(req, res) {
    try {
        const user = await service.getOne(req.params.id)
        if(user) {
            res.send(user)
        }else {
            res.sendStatus(404)
        }
    } catch (error) {
        res.sendStatus(500)
    }
}

async function getAllController(_req,res) {
    try {
        const users = await service.getAll()
        if (users) {
            res.json(users)
        }else {
            res.sendStatus(404)
        }
    } catch (error) {
        res.sendStatus(500)
    }
}

async function postController(req,res) {
    try {
        const body = req.body
        const response = await service.create(body)
        if (response) {
            res.sendStatus(201)
        }else{
            res.sendStatus(400)
        }
    }catch(err) {
        res.sendStatus(500)
    }
}

async function putController(req, res) {
    try{    
        const serviceBody = {"id":req.params.id,"nombre":req.body.nombre}
        const response = await service.update(serviceBody)
        if (response){
            return res.sendStatus(200)
        }else {
            return res.sendStatus(404)
        }
    }catch(err) {
        res.sendStatus(500)
    }
}

async function deleteController(req, res) {
    try {
        const id = req.params.id
        const response = await service.deleteOne(id)
        if (response) {
            return res.sendStatus(200)
        }else {
            return res.sendStatus(404)
        }
    }catch(err) {
        res.sendStatus(500)
    }
}

module.exports = {getController, getAllController, postController, putController, deleteController}