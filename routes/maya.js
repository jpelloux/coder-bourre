var express = require('express');
var path = require('path');
var router = express.Router();
var io = null;

var gameInfos = {
    "players": {},
    "nbPlayers": 0
};

var turnInfo = {
	"player": 0,
	"nextPlayer": 1
};

function main(io){

    io.on('connection', function(socket) {
		socket.on("disconnect", function () {
			if(gameInfos.players[socket.id]) {
				console.log("Disconnect from : ", gameInfos.players[socket.id]);
				socket.broadcast.emit('removePlayer', gameInfos.players[socket.id]);
				delete gameInfos.players[socket.id];
				gameInfos.nbPlayers--;
				displayPlayerNames(socket);
			}
		});

        socket.on('playRequest', function(pseudo, callback){
        	if (pseudo) {
        		addPlayer(socket, pseudo, callback);
            	if (gameInfos.nbPlayers > 1){
            	    io.sockets.emit('canDispGame', '');
            	}
        	}
        });

        socket.on('reachGame', function(pseudo, callback){
        	if(pseudo) {
        		console.log(pseudo + " reach game");
        		addPlayer(socket, pseudo, callback);
        		if (gameInfos.nbPlayers > 1) {
        			console.log("more than 1 player");
        			startGame(socket, callback);
        		}
        	}
        });

        socket.on('goToGame', function(data, callback){
            goToGame(socket, callback);
        });
        socket.on('getDices', function(m){
            socket.emit('getDices', getDices(2));
        });

        socket.on('newTurn', function(data, callback){
        	console.log("newTurn");
            startTurn(socket, callback);
        });
    })

    router.get('/home', function(req, res){  
        res.sendFile("maya/maya_home.html",  {root:'./views'});
    })
    .get('/game', function(req, res){
        res.sendFile("maya/maya_game.html",  {root:'./views'});
    });

    return router;
}

function getDices(nbDices){
    var values = [];
        for (var j=0; j<nbDices; j++){
            values.push(Math.floor(Math.random() * Math.floor(6)) + 1);
        }
    return values;
}

function goToGame(socket, callback) {
	socket.broadcast.emit('goToGame');
	if (callback) {
		callback();
	}
}

function displayPlayerNames(socket, callback) {
	if (gameInfos.players) {
		console.log('displayPlayerNames : ' + Object.values(gameInfos.players));
		socket.broadcast.emit('dispPlayersNames', Object.values(gameInfos.players));
		if (callback) {
			callback(Object.values(gameInfos.players));
		}
	}
}

function addPlayer(socket, pseudo, callback) {
	console.log("playRequest from :" + pseudo +" socket : " + socket.id);
	gameInfos.players[socket.id] = pseudo;
	gameInfos.nbPlayers++;

	console.log(gameInfos.nbPlayers + ' players : ' + Object.values(gameInfos.players));
	socket.broadcast.emit('newPlayer', pseudo);
	displayPlayerNames(socket, callback);
}

function changeTurn() {
	var playerIndex = turnInfo.players;
	if (playerIndex >= Object.keys(gameInfos.players)) {
		playerIndex = 0 ;
	}
	turnInfo.players = playerIndex;
	var nextPlayerIndex = turnInfo.nextPlayer;
	if (nextPlayerIndex >= Object.keys(gameInfos.players)) {
		nextPlayerIndex = 0 ;
	}
	turnInfo.nextPlayer = nextPlayerIndex;
}

function startGame(socket, callback) {
	var socketsIds = Object.keys(gameInfos.players);
	console.log("turnInfo players " + turnInfo.player);
	console.log("socket startGame : " + socketsIds[turnInfo.player]);
	socket.to(socketsIds[turnInfo.players]).emit("startGame", null);
}
function startTurn(socket, callback) {
	console.log("Start turn");
	var socketsIds = Object.keys(gameInfos.players);
	var turn = {
		"activPlayer": gameInfos.players[socketsIds[turnInfo.player]],
		"nextActivePlayer": gameInfos.players[socketsIds[turnInfo.nextPlayer]],
	}
	socket.broadcast.emit('startTurn', turn);
	if (callback) {
		callback(turn);
	}
	socket.to(socketsIds[turnInfo.players]).emit("dices", getDices(2));
}
/*
- Lancer les dés
- Choisir son annonce (mentire ou pas)
- Le joueur suivant annonce (prendre ou menteur) 
- Résolution et gorgé
-- Si tu mensonge joueur relance retour 1
-- Sinon suivant joue retour 1

socket.to(socketsIds[turnInfo.nextPlayer]).emit("nextActivePlayer");
*/

module.exports = main;
