var express = require('express');
var path = require('path');
var router = express.Router();
var io = null;
var enableLog = true;

var gameInfos = {};
var playerRooms= {};

function main(io_){
	io = io_.of('/drinkingWar');
    io.on('connection', function(socket) {
/*****   ALL ****/
		socket.on("disconnect", function () {
			customLog("disconnect from " + getRoom(socket));
			if(gameInfos[getRoom(socket)] && gameInfos[getRoom(socket)].players[socket.id]) {
				customLog("Disconnect from : ", gameInfos[getRoom(socket)].players[socket.id]);
				io.to(playerRooms[socket.id]).emit("needToRefreshRoom");
				io.to("drinkingWar_lobby").emit("needToRefreshRoom");
				delete gameInfos[getRoom(socket)].players[socket.id];
				gameInfos[getRoom(socket)].nbPlayers--;
				displayPlayerNames(socket);
			}
		});

/*****   LOBBY ****/
		socket.on('lobbyJoined', function(){
            joinRoom(socket, "drinkingWar_lobby");
        });
        socket.on('getRoomsAndPlayers', function(data, callback){
        	customLog("getRoomsAndPlayers reached");
            callback(io.adapter.rooms);
        });

/*****   GAME   ****/
        socket.on('reachGame', function(data, callback){
        	if (data && data.pseudo && data.roomName) {
        		data.roomName = "drinkingWar_game_" + data.roomName;
        		customLog(data.pseudo + " reach game : " + data.roomName);
        		joinRoom(socket, data.roomName);
        		addPlayer(socket, data, callback);
        	}
        });

       
    })

    router.get('/home', function(req, res){  
        res.sendFile("drinkingWar/drinkingWar_home.html",  {root:'./views'});
    })
    .get('/game', function(req, res){
        res.sendFile("drinkingWar/drinkingWar_game.html",  {root:'./views'});
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
function sendToLobby(event, data, cb) {
	io.to("drinkingWar_lobby").emit(event, data, cb);
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
function startTurn(socket) {

}

/*** UTILS ***/
function customLog(msg) {
	if (enableLog) {
		console.log(msg);
	}
}

module.exports = main;
