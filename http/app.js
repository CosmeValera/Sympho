const express = require("express");
const path = require("path");
const app = express();
const PORT = 9494
const bodyParser = require("body-parser");
const controller = require('./controller.js')
const dbSheets = require('./dbSheets')
const dbUsers = require('./dbUsers')

app.use(express.static(path.join(__dirname, "../public")));
app.use(express.json());
app.use(
    bodyParser.urlencoded({
        extended: true,
    })
);
app.use(bodyParser.json());


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

app.listen(PORT, () => console.log("Listening in port " + PORT));