var express = require('express');
var path = require('path');
var router = express.Router();
var io = null;
var players = [];

router.get('/', function (req, res, next) {
	var app = req.app;
	io = app.get("io");

	io.on("connection", function(socket){
		console.log("FTD connection handling");
		socket.on("playerconnection", function(data){
			console.log(data.name);
			players.push(data.name);
			socket.broadcast.emit("playerupdate", players);
		});
	});

	res.sendFile("fuckthedealer.html",  {root:'./views'});

});

module.exports = router;