// Dependencies
var express = require('express');
var http = require('http');
var path = require('path');
var socketIO = require('socket.io');
var app = express();
var server = http.Server(app);
var gameRouter = require("./routes/game");
var ftdRouter = require("./routes/fuckthedealer");
var mayaRouter = require("./routes/maya");

var io = socketIO(server);

app.set('port', 5000);
//share socket.io between app
app.set('io', io)

//static -> Fichier envoyés au navigateur (js client)
app.use('/static', express.static(__dirname + '/static'));
app.get('/', function(request, response) {
  response.sendFile(path.join(__dirname, 'index.html'));
});

app.use("/game", gameRouter);
app.use("/fuckthedealer", ftdRouter);
app.use("/maya", mayaRouter(io));

// Starts the server.
server.listen(5000, function() {
  console.log('Starting server on port 5000');
});

// Add the WebSocket handlers
//module.exports est un objet un peu particulier
//C'est l'équivalent d'un "return", c'est pour ca qu'on le revnoi dans game.js
module.exports = app;