var express = require('express');
var router = express.Router();
var players = {};

var cards = [];
var currentCard ; 
var errorCount;
var removedCards = [];

function main(io)
{
	io.on("connection", function(socket){
		console.log("FTD connection handling", socket.id);

		socket.on("playerconnection", function(data, callback){
			console.log("Player connection : ", data.name);

			players[socket.id] = data.name ; 
			
			console.log("List of player now : ", Object.values(players));
			socket.broadcast.emit("playerupdate", Object.values(players));
			callback(Object.values(players));
		});
		
		socket.on("disconnect", function () {
			console.log("Disconnect from : ", players[socket.id]);
			delete players[socket.id];
		});
	
		socket.on("newgame", function(clientData, callback){
			cards = generateAllCards();
			var playersName = Object.values(players);
			errorCount = 0;
			var dealer; 
			if (clientData.dealerChoice === "player")
			{
				dealer = players[socket.id];
			}
			else
			{
				var randDealerIdx = Math.floor(Math.random() * Math.floor(playersName.length))
				dealer = playersName[randDealerIdx];
			}
			console.log("new game from ", data);
			var data = {
				players: playersName,
				dealer:dealer		
			};
			socket.broadcast.emit("newgamecreated", data);
			callback(data);
		});

		socket.on("getcard", function(callback){
			//TODO : Security : give card only if socket id is the one of the dealer
			var c = getCard();
			callback(c);
		});

		socket.on("displaycard", function(callback){
			socket.broadcast.emit("newdisplayedcard", currentCard);
			callback(currentCard);
		});

		socket.on("notfound", function(callback){
			errorCount++ ; 
			if(errorCount >= 3)
			{
				errorCount = 0 ;
				var ids = Object.keys(players);
				var index = ids.indexOf(socket.id);
				index++ ; 

				if (index >= ids.length)
				{
					index = 0 ;
				}
				var ret = {"name":players[ids[index]]}
				socket.broadcast.emit("dealerupdate", ret);				
				callback(ret);
			}
			else
			{
				callback({"name" : players[socket.id]});
			}
			
		});

	});
	router.get('/', function (req, res, next) {
		res.sendFile("fuckthedealer.html",  {root:'./views'});
	});

	return router;
}

function generateAllCards()
{
	console.log("Generating cards");
	var symbol = ["PIQUE", "TREFLE", "COEUR", "CARREAU"];
	var value = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "V", "D", "R", "A"];
	var ret = [];
	value.forEach((v) => {
		symbol.forEach(s => ret.push([v, s]));
	});
	
	return ret; 
}

function getCard()
{
	let r = Math.floor(Math.random() * Math.floor(cards.length));
	let card = cards[r];
	cards.splice(r, 1);
	removedCards.push(cards);
	currentCard = card;
	return card;
}

module.exports = main;