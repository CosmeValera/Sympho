const express = require("express");
const app = express();
const PORT = 9495
const controller = require('./controller.js')
const db = require('./db.js')

db.conn()
app.use(express.json())

app.get("/", controller.getAllController);

app.get("/:id", controller.getController);

app.post("/", controller.postController)

app.put("/:id", controller.putController)

app.delete("/:id", controller.deleteController)

app.listen(PORT, () => console.log("En escucha"))