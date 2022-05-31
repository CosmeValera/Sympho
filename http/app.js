const express = require("express");
const app = express();
const PORT = 9494
const controller = require('./controller.js')
const dbSheets = require('./dbSheets')
const dbUsers = require('./dbUsers')

dbUsers.conn()
dbSheets.conn()

app.use(express.json())

app.get("/login/:id", controller.loginController);

app.post("/register", controller.registerController);

app.get("/sheets", controller.getAllController);

app.get("/sheets/:id", controller.getController);

app.post("/sheets", controller.postController);

app.get("/mysheets", controller.getAllController);

app.get("/mysheets/:id", controller.getController);

app.post("/mysheets", controller.postController);

app.put("/mysheets/:id", controller.putController);

app.delete("/mysheets/:id", controller.deleteController);

app.listen(PORT, () => console.log("En escucha"));