const express = require("express");
const app = express();
const PORT = 9494
const controller = require('./controller.js')
const dbSheets = require('./dbSheets')
const dbMySheets = require('./dbMySheets')
const passport = require('passport');
const session = require('express-session')
require('./auth')

//dbSheets.conn()
function isLoggedIn(req,res,next) {
  req.user ? next() : res.sendStatus(401);
}
app.use(session({secret:"cats"}))
app.use(passport.initialize())
app.use(passport.session())
app.use(express.json())

app.get("/login", (req, res) => {
  res.sendFile("C:\\Users\\p-jgomariz\\Sympho\\src\\account\\account.html")
})
app.get('/google/auth', passport.authenticate('google', {scope: ['email', 'profile']}))

app.get('/google/callback', passport.authenticate('google', {successRedirect: '/account',
failureRedirect: '/login'}))

app.get("/sheets", controller.getAllController);

app.get("/sheets/:id", controller.getController);

app.post("/sheets", isLoggedIn, controller.postController);

app.get("/mysheets", isLoggedIn, controller.getAllController);

app.get("/mysheets/:id", isLoggedIn, controller.getController);

app.post("/mysheets", isLoggedIn, controller.postController);

app.put("/mysheets/:id", isLoggedIn, controller.putController);

app.delete("/mysheets/:id", isLoggedIn, controller.deleteController);

app.get("/account", isLoggedIn, (req, res) => {
  //dbMySheets.conn(req.user.sub)
  res.send({"nombre": req.user.displayName, "imagen": req.user.picture, "id_cuenta":req.user.sub})
})

app.listen(PORT, () => console.log(PORT));