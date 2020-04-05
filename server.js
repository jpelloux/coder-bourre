// Dependencies
var express = require('express');
var http = require('http');
var path = require('path');
var port = 80; 
var app = express();  
var server = http.createServer(app);


var io = require('socket.io').listen(server);

var gameRouter = require("./routes/game");
var ftdRouter = require("./routes/fuckthedealer");
//share socket.io between app
app.set('io', io)

//static -> Fichier envoyés au navigateur (js client)
app.use('/static', express.static(__dirname + '/static'));
app.get('/', function(request, response) {
	response.sendFile(path.join(__dirname, 'index.html'));
});

app.use("/game", gameRouter);
app.use("/fuckthedealer", ftdRouter(io));

// Starts the server.
server.listen(port, function(){
	console.log("Server started on port " + port);
});

// Add the WebSocket handlers
//module.exports est un objet un peu particulier
//C'est l'équivalent d'un "return", c'est pour ca qu'on le revnoi dans game.js
module.exports = app;