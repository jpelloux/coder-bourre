var express = require('express');
var path = require('path');
var router = express.Router();
var players = {};

function main(io)
{
	io.on("connection", function(socket){
		console.log("FTD connection handling", socket.id);

		socket.on("playerconnection", function(data){
			console.log("Player connection : ", data.name);

			players[socket.id] = data.name ; 
			
			console.log("List of player now : ", Object.values(players));
			socket.broadcast.emit("playerupdate", Object.values(players));
		});
	
		socket.on("newgame", function(name){
			console.log("new game from ", name);
			socket.broadcast.emit("newgamecreated", {players: Object.values(players), dealer:name});
		});

		socket.on("disconnect", function () {
			console.log("Disconnect from : ", players[socket.id]);
			delete players[socket.id];
		});


		router.get('/', function (req, res, next) {
			res.sendFile("fuckthedealer.html",  {root:'./views'});
		});
	});
	return router;
}


module.exports = main;