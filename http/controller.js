const service = require('./service')

async function getController(req, res) {
    try {
        const isPriv = req.body.isPriv
        const sheet = await service.getOne(req.params.id, isPriv)
        if(sheet) {
            res.send(sheet)
        }else {
            res.sendStatus(404)
        }
    } catch (error) {
        res.sendStatus(500)
    }
}

async function getAllController(req,res) {
    try {
        const isPriv = req.body.isPriv
        const sheets = await service.getAll(isPriv)
        if (sheets) {
            res.json(sheets)
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
        const serviceBody = {"id":req.params.id,"nombre":req.body.nombre, "value": req.body.value}
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

async function loginController(req, res) {
    try {
        const response = await service.login(req.params.id, req.body)
        if (response == true) {
            res.send(200)
        }else if (response == false){
            res.sendStatus(401)
        }else {
            res.sendStatus(404)
        }        
    }catch(err) {
        res.sendStatus(500)
    }
}

async function registerController(req, res) {
    try {
        const body = req.body
        const response = await service.resgister(body)
        if (response) {
            res.sendStatus(201)
        }else {
            res.sendStatus(400)
        }
    } catch (err) {
        res.sendStatus(500)
    }
}

module.exports = {getController, getAllController, postController, putController, deleteController, loginController, registerController}