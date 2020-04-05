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
	"nextPlayer": 1,
	"realDices": [],
	"choosenDices": []
};

function main(io_){
	io = io_;
    io.on('connection', function(socket) {
		socket.on("disconnect", function () {
			if(gameInfos.players[socket.id]) {
				console.log("Disconnect from : ", gameInfos.players[socket.id]);
				socket.broadcast.emit('removePlayer', gameInfos.players[socket.id]);
				delete gameInfos.players[socket.id];
				gameInfos.nbPlayers--;
				displayPlayerNames();
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
        		socket.join("maya_game");
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

        socket.on('diceCall', function(choosenDices){
        	turnInfo.choosenDices = choosenDices
            io.to("maya_game").emit("diceCalled", choosenDices);
            getNextPlayerChoice(socket);
        });
        socket.on('takeOrLie', function(choice){
        	io.to("maya_game").emit("takeOrLieResult", choice);
            takeOrLieResolver(socket, choice);
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

function displayPlayerNames() {
	if (gameInfos.players) {
		console.log('displayPlayerNames : ' + Object.values(gameInfos.players));
		io.to("maya_game").emit("dispPlayersNames", Object.values(gameInfos.players));
	}
}

function addPlayer(socket, pseudo, callback) {
	console.log("playRequest from :" + pseudo +" socket : " + socket.id);
	gameInfos.players[socket.id] = pseudo;
	gameInfos.nbPlayers++;

	console.log(gameInfos.nbPlayers + ' players : ' + Object.values(gameInfos.players));
	socket.broadcast.emit('newPlayer', pseudo);
	displayPlayerNames();
}

function changeTurn() {
	console.log(turnInfo);
	console.log(gameInfos);
	console.log(Object.keys(gameInfos.players).length);

	var playerIndex = turnInfo.player + 1;
	if (playerIndex >= Object.keys(gameInfos.players).length) {
		playerIndex = 0 ;
	}
	turnInfo.player = playerIndex;
	var nextPlayerIndex = turnInfo.nextPlayer + 1;
	if (nextPlayerIndex >= Object.keys(gameInfos.players).length) {
		nextPlayerIndex = 0 ;
	}
	turnInfo.nextPlayer = nextPlayerIndex;
	console.log(turnInfo);
}

function startGame(socket, callback, io) {
	var socketsIds = Object.keys(gameInfos.players);
	console.log("turnInfo players " + turnInfo.player);
	console.log("socket startGame : " + socketsIds[turnInfo.player]);
	startTurn(socket);
	//socket.to(socketsIds[turnInfo.players]).emit("startGame", null);
}
function startTurn(socket, callback) {
	console.log("Start turn");
	var socketsIds = Object.keys(gameInfos.players);
	var turn = {
		"activPlayer": gameInfos.players[socketsIds[turnInfo.player]],
		"nextActivePlayer": gameInfos.players[socketsIds[turnInfo.nextPlayer]],
	}
	io.to("maya_game").emit("startTurn", turn);
	turnInfo.realDices = getDices(2)
	if (socketsIds[turnInfo.player] == socket.id) {
		console.log("activPlayer == socket");
		socket.emit("dices", turnInfo.realDices);
	} else {
		console.log("activPlayer =/= socket");
		io.to(socketsIds[turnInfo.player]).emit('dices', turnInfo.realDices);
	}
}
function getNextPlayerChoice(socket) {
	var socketsIds = Object.keys(gameInfos.players);
	if (socketsIds[turnInfo.nextPlayer] == socket.id) {
		console.log("nextPlayer == socket");
		socket.emit("takeOrLie");
	} else {
		console.log("nextPlayer =/= socket");
		io.to(socketsIds[turnInfo.nextPlayer]).emit('takeOrLie');
	}
}

function takeOrLieResolver(socket, choice) {
	if (choice) { //next player take it
		changeTurn();
		startTurn(socket);
	} else { //next player say lier
		if (!isSameDices()) { //player lied
			lied(true);
			playerDrink();
			startTurn(socket);
		} else { //player didn't lied
			lied(false);
			nextPlayerDrink();
			changeTurn();
			startTurn(socket);
		}
	}
}
function playerDrink() {
	
	var socketsIds = Object.keys(gameInfos.players);
	var sips = sipCalculator(turnInfo.choosenDices);
	drinks = [{
		"player": gameInfos.players[socketsIds[turnInfo.player]],
		"sip": sips["sip"],
		"bottomUp": sips["bottomUp"]
	}];
	sendDrinks(drinks);
}
function nextPlayerDrink() {
	var socketsIds = Object.keys(gameInfos.players);
	var sips = sipCalculator(turnInfo.choosenDices, 2);
	drinks = [{
		"player": gameInfos.players[socketsIds[turnInfo.nextPlayer]],
		"sip": sips["sip"],
		"bottomUp": sips["bottomUp"]
	}];
	sendDrinks(drinks);
}
function allDrink() {
	//TODO 51
	sendDrinks(drinks);
}
function sendDrinks(drinks) {
	io.to("maya_game").emit("drinks", drinks);
}
function isSameDices() {
	turnInfo.realDices.sort(compare);
	turnInfo.choosenDices.sort(compare);
	if(turnInfo.realDices.length != turnInfo.choosenDices.length) {
		return false; 
	} else { 
   		for(var i = 0; i < turnInfo.realDices.length; i++) {
   			if(turnInfo.realDices[i] != turnInfo.choosenDices[i]) {
   				return false; 
   			}
   		}
    	return true; 
  	} 
}

function compare(x, y) {
    return y - x;
}

function isDouble(dices) {
	return dices[0] == dices[1];
}

function is51(dices) {
	return (dices[0] == 5 && dices[1] == 1) || (dices[0] == 1 && dices[1] == 5);
}

function isMaya(dices) {
	return (dices[0] == 2 && dices[1] == 1) || (dices[0] == 1 && dices[1] == 2);
}

function sipCalculator(dices, coef) {
	var sip = 0;
	var bottomUp = 0;
	if (isMaya(dices)) {
		bottomUp++;
	} else if (isDouble(dices)) {
		sip = dices[0];
	} else {
		sip++;
	}
	if (coef) {
		sip = sip*coef;
		bottomUp = bottomUp*coef;
	}
	return {
		"sip": sip,
		"bottomUp": bottomUp
	}
}
function lied(result) {
	io.to("maya_game").emit("lied", result);
}
/*
- Lancer les dés
- Choisir son annonce (mentire ou pas)
- Le joueur suivant annonce (prendre ou menteur) 
- Résolution et gorgé
-- Si tu mensonge joueur relance retour 1
-- Sinon suivant joue retour 1


-- MAYA
-- 51

socket.to(socketsIds[turnInfo.nextPlayer]).emit("nextActivePlayer");
*/

module.exports = main;
