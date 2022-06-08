const express = require("express");
const app = express();
const PORT = 9494
const controller = require('./controller.js')
const dbSheets = require('./dbSheets')
const dbMySheets = require('./dbMySheets')

dbSheets.conn()

app.use(express.json())


app.get("/login/:id", (req, res) => {
    dbMySheets.conn(`privRepo_${req.params.id}`)
    console.log(req.params.id)
    res.send(200)
});

app.get("/sheets", controller.getAllController);

app.get("/sheets/:id", controller.getController);

app.post("/sheets", controller.postController);

app.get("/mysheets", controller.getAllPrivController);

app.get("/mysheets/:id", controller.getPrivController);

app.put("/mysheets/:id", controller.putController);

app.delete("/mysheets/:id", controller.deleteController);

app.listen(PORT, () => console.log("En escucha"));