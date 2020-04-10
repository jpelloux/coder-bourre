var express = require('express');
var path = require('path');
var router = express.Router();
var io = null;
var enableLog = true;

var decks = require('decks/deck');

var playerRooms= {};
var roomsDrinkingWar = {};

var gameName = "coinche";

function main(io_){
	io = io_.of('/coinche');
    io.on('connection', function(socket) {
/*****   ALL ****/
		socket.on("disconnect", function () {
			customLog("disconnect from " + getRoom(socket));
			if(getDrinkingWar(socket) && getDrinkingWar(socket).getPlayerBySocket(socket)) {
				customLog("Disconnect from : ", getDrinkingWar(socket).getPlayerBySocket(socket));
				io.to(playerRooms[socket.id]).emit("needToRefreshRoom");
				io.to(gameName + "_lobby").emit("needToRefreshRoom");
				getDrinkingWar(socket).disconnectPlayer(socket);
				delete playerRooms[socket.id];
				displayPlayerNames(socket);
			}
		});

/*****   LOBBY ****/
		socket.on('lobbyJoined', function() {
            joinRoom(socket, gameName + "_lobby");
        });
        socket.on('getRoomsAndPlayers', function(data, callback) {
        	customLog("getRoomsAndPlayers reached");
            callback(io.adapter.rooms);
        });
        socket.on('teamJoined', function(team) {
        	getDrinkingWar(socket).getPlayerBySocket(socket).setTeam(team);
        	displayPlayerNames(socket);
        });

/*****   GAME   ****/
        socket.on('reachGame', function(data, callback) {
        	if (data && data.pseudo && data.roomName) {
        		data.roomName = gameName + "_game_" + data.roomName;
        		customLog(data.pseudo + " reach game : " + data.roomName);
        		joinRoom(socket, data.roomName);
        		addPlayer(socket, data, callback);
        	}
        });
		socket.on('startGame', function() {
        	startGame(socket);
        });
       
    })

    router.get('/home', function(req, res){  
        res.sendFile(gameName + "/" + gameName + "_home.html",  {root:'./views'});
    })
    .get('/game', function(req, res){
        res.sendFile(gameName + "/" + gameName + "_game.html",  {root:'./views'});
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
function getDrinkingWar(socket) {
	return roomsDrinkingWar[getRoom(socket)];
}

/*****   LOBBY ****/
function sendToLobby(event, data, cb) {
	io.to(gameName + "_lobby").emit(event, data, cb);
}

/*****   GAME  ****/
function addPlayer(socket, data, callback) {
	if (getDrinkingWar(socket) && getDrinkingWar(socket).canStartGame()) {
		socket.emit("lobbyFull");
	}
	customLog("===================================== joinGame : " + data.pseudo + " on room : " + getRoom(socket));
	if (!getDrinkingWar(socket)) {
		customLog("============================== coinch game created")
		roomsDrinkingWar[getRoom(socket)] = new Coinche();
	}
	getDrinkingWar(socket).addPlayer(data.pseudo, socket);
	displayPlayerNames(socket);
}
function displayPlayerNames(socket) {
	if (socket && getRoom(socket)) {
		customLog(getRoom(socket) + ' : displayPlayerNames : ' + Object.values(getDrinkingWar(socket).displayAllPlayers()));
		sendToRoom(socket, "dispPlayersNames", Object.values(getDrinkingWar(socket).displayAllPlayers()));
	}
}
function startGame(socket) {
	customLog("=== GAME STARTED");
	getDrinkingWar(socket).startGame();
	sendToRoom(socket, "startGame");
	displayPlayerNames(socket);
	getDrinkingWar(socket).getAllPlayers().forEach(player => {
		customLog("==player " + player.getName() + " hand :" + player.getHand())
		player.getSocket().emit('hand', player.getSortedHand());
	});	
}
function startTurn(socket) {

}

/*** UTILS ***/
function customLog(msg) {
	if (enableLog) {
		console.log(msg);
	}
}

/*** CLASS ***/
class Coinche {
    constructor(){
 	  this.deck = decks.getDeck();
 	  this.discard = decks.getDiscard();
 	  this.players = [];

 	  this.maxHandSize = 8;
 	  this.initialHandSize = 8;
 	  this.nbPlayerNeededToStart = 4;

 	  this.currentPlayer = 0;
 	}
  	addPlayer(name, socket) {
	 	this.players.push(decks.getPlayer(this.maxHandSiz, name, socket));
	}
	disconnectPlayer(socket) {
		if (socket) {
			var playerIndex = this.players.findIndex(player => {
				return player.socket.id == socket.id;
			});
			this.players.splice(playerIndex, 1);
		}
	}
	getPlayerBySocket(socket) {
		if (socket) {
			return this.players.find(player => {
				return player.socket.id == socket.id;
			});
		}
	}
	startGame() {
		for (let i=0; i < this.initialHandSize; i++) {
			this.players.forEach(player => {
				this.playerDrawOneCard(player);
			})
		}
	}
	nextTurn() {
		this.currentPlayer++;
		if (this.currentPlayer >= this.players.length) {
			this.currentPlayer = 0;
		}
	}
	canStartGame() {
		return this.nbPlayerNeededToStart == this.players.length;
	}
	getAllPlayers() {
		return this.players;
	}
	getPlayer(index) {
		return this.players[index];
	}
	playerDrawOneCard(player) {
		return player.addCard(this.deck.draw());
	}
	playCard(player, indexOfCard) {
		return this.discard.discardCard(player.getCard(indexOfCard));
	}
	getNbPlayers() {
		return this.players.length;
	}
	/** TEAMS **/
	/** DISPLAY **/
	displayAllPlayers() {
		return this.players.map(player => {
			return {
				"name" :player.getName(), 
				"team" :player.getTeam()
			};
		});
	}
	/** CURRENT PLAYER **/
	getCurrentPlayer() {
		return this.getPlayer(this.currentPlayer);
	}
	getCurrentPlayerHand() {
		return this.getPlayer(this.getCurrentPlayer()).getHand();
	}
	currentPlayerDrawOneCard() {
		return this.playerDrawOneCard(this.getCurrentPlayer());
	}
	currentPlayerPlayCard(indexOfCard) {
		return this.playerDrawOneCard(this.getCurrentPlayer(), indexOfCard);
	}
}





module.exports = main;



