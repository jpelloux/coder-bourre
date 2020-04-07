var express = require('express');
var path = require('path');
var router = express.Router();
var io = null;
var enableLog = true;

var gameInfos = {};
var playerRooms= {};

function main(io_){
	io = io_;
    io.on('connection', function(socket) {
/*****   ALL ****/
		socket.on("disconnect", function () {
			customLog("disconnect from " + getRoom(socket));
			if(gameInfos[getRoom(socket)] && gameInfos[getRoom(socket)].players[socket.id]) {
				customLog("Disconnect from : ", gameInfos[getRoom(socket)].players[socket.id]);
				io.to(playerRooms[socket.id]).emit("needToRefreshRoom");
				io.to("maya_lobby").emit("needToRefreshRoom");
				delete gameInfos[getRoom(socket)].players[socket.id];
				gameInfos[getRoom(socket)].nbPlayers--;
				displayPlayerNames(socket);
			}
		});

/*****   LOBBY ****/
		socket.on('lobbyJoined', function(){
            joinRoom(socket, "maya_lobby");
        });
        socket.on('getRoomsAndPlayers', function(data, callback){
        	customLog("getRoomsAndPlayers reached");
            callback(io.sockets.adapter.rooms);
        });

/*****   GAME   ****/
        socket.on('reachGame', function(data, callback){
        	if (data && data.pseudo && data.roomName) {
        		data.roomName = "maya_game_" + data.roomName;
        		customLog(data.pseudo + " reach game : " + data.roomName);
        		joinRoom(socket, data.roomName);
        		addPlayer(socket, data, callback);
        	}
        });

        socket.on('getDices', function(m){
            socket.emit('getDices', getDices(2));
        });

        socket.on('newTurn', function(data, callback){
        	customLog("newTurn");
            startTurn(socket, callback);
        });

        socket.on('diceCall', function(choosenDices){
        	gameInfos[getRoom(socket)].turnInfo.choosenDices = choosenDices
            sendToRoom(socket,"diceCalled", choosenDices);
            getNextPlayerChoice(socket);
        });
        socket.on('takeOrLie', function(choice){
        	sendToRoom(socket,"takeOrLieResult", choice);
            takeOrLieResolver(socket, choice);
        });
        socket.on('51', function(choice){
        	sendToRoom(socket,"51", choice);
        	startTurn(socket);
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
/*****   ROOMS ****/
function joinRoom(socket, roomName) {
	if (playerRooms[socket.id]) {
		socket.leave(getRoom(socket));
		customLog("ping leave" + getRoom(socket));
		sendToRoom(socket, "needToRefreshRoom");
	}
	socket.join(roomName);
	playerRooms[socket.id] = roomName;
	sendToRoom(socket, "needToRefreshRoom");
	sendToLobby("needToRefreshRoom");
	customLog("ping join " + playerRooms[socket.id]);
}
function getRoom(socket) {
	return playerRooms[socket.id];
}
function sendToRoom(socket, event, data, cb) {
	io.to(getRoom(socket)).emit(event, data, cb);
}

/*****   LOBBY ****/
function goToGame(socket, callback) {
	socket.broadcast.emit('goToGame');
	if (callback) {
		callback();
	}
}
function sendToLobby(event, data, cb) {
	io.to("maya_lobby").emit(event, data, cb);
}

/*****   GAME  ****/
function addPlayer(socket, data, callback) {
	customLog("playRequest from :" + data.pseudo +" socket : " + socket.id);
	if (!gameInfos[getRoom(socket)]) {
		gameInfos[getRoom(socket)] = {
			"players": {},
    		"nbPlayers": 0,
    		"turnInfo": {
				"player": 0,
				"nextPlayer": 1,
				"realDices": [],
				"choosenDices": []
			}
		};
	} 
	gameInfos[getRoom(socket)].players[socket.id] = data.pseudo;
	gameInfos[getRoom(socket)].nbPlayers++;
	customLog(gameInfos[getRoom(socket)].nbPlayers + ' players : ' + Object.values(gameInfos[getRoom(socket)].players));
	displayPlayerNames(socket);
	if (gameInfos[getRoom(socket)].nbPlayers = 2) {
		startTurn(socket);
	}
}
function displayPlayerNames(socket) {
	customLog("----------------------------------------------------" + getRoom(socket));
	if (socket && getRoom(socket)) {
		enableLog ? customLog(getRoom(socket) + ' : displayPlayerNames : ' + Object.values(gameInfos[getRoom(socket)].players)) : "";
		sendToRoom(socket, "dispPlayersNames", Object.values(gameInfos[getRoom(socket)].players));
	}
}

function getDices(nbDices){
    var values = [];
        for (var j=0; j<nbDices; j++){
            values.push(Math.floor(Math.random() * Math.floor(6)) + 1);
        }
    return values;
}

function changeTurn(socket) {
	customLog(gameInfos[getRoom(socket)].turnInfo);
	customLog(gameInfos);
	customLog(Object.keys(gameInfos[getRoom(socket)].players).length);

	var playerIndex = gameInfos[getRoom(socket)].turnInfo.player + 1;
	if (playerIndex >= Object.keys(gameInfos[getRoom(socket)].players).length) {
		playerIndex = 0 ;
	}
	gameInfos[getRoom(socket)].turnInfo.player = playerIndex;
	var nextPlayerIndex = gameInfos[getRoom(socket)].turnInfo.nextPlayer + 1;
	if (nextPlayerIndex >= Object.keys(gameInfos[getRoom(socket)].players).length) {
		nextPlayerIndex = 0 ;
	}
	gameInfos[getRoom(socket)].turnInfo.nextPlayer = nextPlayerIndex;
	customLog(gameInfos[getRoom(socket)].turnInfo);
}

function startGame(socket, callback, io) {
	var socketsIds = Object.keys(gameInfos[getRoom(socket)].players);
	customLog("gameInfos[getRoom(socket)].turnInfo players " + gameInfos[getRoom(socket)].turnInfo.player);
	customLog("socket startGame : " + socketsIds[gameInfos[getRoom(socket)].turnInfo.player]);
	startTurn(socket);
}
function startTurn(socket, callback) {
	customLog("Start turn");
	var socketsIds = Object.keys(gameInfos[getRoom(socket)].players);
	var turn = {
		"activPlayer": gameInfos[getRoom(socket)].players[socketsIds[gameInfos[getRoom(socket)].turnInfo.player]],
		"nextActivePlayer": gameInfos[getRoom(socket)].players[socketsIds[gameInfos[getRoom(socket)].turnInfo.nextPlayer]],
	}
	sendToRoom(socket, "startTurn", turn);
	gameInfos[getRoom(socket)].turnInfo.realDices = getDices(2)
	if (socketsIds[gameInfos[getRoom(socket)].turnInfo.player] == socket.id) {
		customLog("activPlayer == socket");
		socket.emit("dices", gameInfos[getRoom(socket)].turnInfo.realDices);
	} else {
		customLog("activPlayer =/= socket");
		io.to(socketsIds[gameInfos[getRoom(socket)].turnInfo.player]).emit('dices', gameInfos[getRoom(socket)].turnInfo.realDices);
	}
}
function getNextPlayerChoice(socket) {
	var socketsIds = Object.keys(gameInfos[getRoom(socket)].players);
	if (socketsIds[gameInfos[getRoom(socket)].turnInfo.nextPlayer] == socket.id) {
		customLog("nextPlayer == socket");
		socket.emit("takeOrLie");
	} else {
		customLog("nextPlayer =/= socket");
		io.to(socketsIds[gameInfos[getRoom(socket)].turnInfo.nextPlayer]).emit('takeOrLie');
	}
}

function takeOrLieResolver(socket, choice) {
	if (choice) { //next player take it
		changeTurn(socket);
		startTurn(socket);
	} else { //next player say lier
		if (!isSameDices(socket)) { //player lied
			lied(socket, true);
			playerDrink(socket);
			startTurn(socket);
		} else { //player didn't lied
			lied(socket, false);
			nextPlayerDrink(socket);
			changeTurn(socket);
			startTurn(socket);
		}
	}
}
function playerDrink(socket) {
	var socketsIds = Object.keys(gameInfos[getRoom(socket)].players);
	var sips = sipCalculator(gameInfos[getRoom(socket)].turnInfo.choosenDices);
	drinks = [{
		"player": gameInfos[getRoom(socket)].players[socketsIds[gameInfos[getRoom(socket)].turnInfo.player]],
		"sip": sips["sip"],
		"bottomUp": sips["bottomUp"]
	}];
	sendDrinks(socket, drinks);
}
function nextPlayerDrink(socket) {
	var socketsIds = Object.keys(gameInfos[getRoom(socket)].players);
	var sips = sipCalculator(gameInfos[getRoom(socket)].turnInfo.choosenDices, 2);
	drinks = [{
		"player": gameInfos[getRoom(socket)].players[socketsIds[gameInfos[getRoom(socket)].turnInfo.nextPlayer]],
		"sip": sips["sip"],
		"bottomUp": sips["bottomUp"]
	}];
	sendDrinks(socket, drinks);
}
function allDrink(socket) {
	//TODO 51
	sendDrinks(socket, drinks);
}
function sendDrinks(socket, drinks) {
	sendToRoom(socket, "drinks", drinks)
}
function isSameDices(socket) {
	gameInfos[getRoom(socket)].turnInfo.realDices.sort(compare);
	gameInfos[getRoom(socket)].turnInfo.choosenDices.sort(compare);
	if(gameInfos[getRoom(socket)].turnInfo.realDices.length != gameInfos[getRoom(socket)].turnInfo.choosenDices.length) {
		return false; 
	} else { 
   		for(var i = 0; i < gameInfos[getRoom(socket)].turnInfo.realDices.length; i++) {
   			if(gameInfos[getRoom(socket)].turnInfo.realDices[i] != gameInfos[getRoom(socket)].turnInfo.choosenDices[i]) {
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
function lied(socket, result) {
	sendToRoom(socket, "lied", result);
}

/*** UTILS ***/
function customLog(msg) {
	if (enableLog) {
		console.log(msg);
	}
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

socket.to(socketsIds[gameInfos[getRoom(socket)].turnInfo.nextPlayer]).emit("nextActivePlayer");
*/

module.exports = main;
