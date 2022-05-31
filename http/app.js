const express = require("express");
const app = express();
const PORT = 9495
const controller = require('./controller.js')
const db = require('./db.js')

db.conn()
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