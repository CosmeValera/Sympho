const express = require("express");
const app = express();
const PORT = 9494
const passport = require('passport');
const session = require('express-session');
const path = require('path')


require('./auth')

function isLoggedIn(req,res,next) {
  req.user ? next() : res.sendStatus(401);
}
app.use(session({secret:"cats"}))
app.use(passport.initialize())
app.use(passport.session())
app.use(express.json())
app.use(express.static(path.join(__dirname, "../public")))

app.get('/google/auth', passport.authenticate('google', {scope: ['email', 'profile']}))

app.get('/google/callback', passport.authenticate('google', {successRedirect: 'http://localhost:9494/src/account/account.html',
failureRedirect: '/login'}))

app.get("/sheets", isLoggedIn, (req, res) =>{
  res.send(200)
});

app.get("/mysheets", isLoggedIn, (req, res) => {
  res.send(200)
});

app.get("/logout", isLoggedIn, (req, res) => {
  res.clearCookie("connect_sid")
  res.clearCookie("g_state")
  res.redirect('http://localhost:9494/src/account/account.html')
})


app.get("/account", isLoggedIn, (req, res) => {
  var user = {"nombre": req.user.displayName,"imagen": req.user.picture, "id_cuenta":req.user.sub}
  res.send(user)
})

app.listen(PORT, () => console.log(PORT));
