var express = require('express');
var path = require('path');
var router = express.Router();
var io = null;

//On peut catch toutes les sous url de /game
router.get('/', function (req, res, next) {
	
	var app = req.app;
	io = app.get("io");
	
	var players = {};
	io.on('connection', function(socket) {
		socket.on('new player', function() {
			players[socket.id] = {
				x: 300,
				y: 300
				};
	});
	socket.on('movement', function(data) {
		var player = players[socket.id] || {};
		if (data.left) {
		player.x -= 5;
		}
		if (data.up) {
		player.y -= 5;
		}
		if (data.right) {
		player.x += 5;
		}
		if (data.down) {
		player.y += 5;
		}
		});
	});
	setInterval(function() {
		io.sockets.emit('state', players);
	}, 1000 / 60);
	res.sendFile("game.html",  {root:'./views'});
	

});

module.exports = router;
