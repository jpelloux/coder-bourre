var express = require('express');
var router = express.Router();
var players = {};
var dealerIndex; 
var nextDealerIndex; 
var nextPlayerIndex; 

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
			if (clientData.dealerChoice === "player") {
				dealerIndex = Object.keys(players).indexOf(socket.id);
			}
			else {
				dealerIndex = Math.floor(Math.random() * playersName.length)
			}
			nextPlayerIndex = (dealerIndex + 1) % playersName.length;
			nextDealerIndex = dealerIndex;
			var data = {
				players: playersName,
				dealer:playersName[dealerIndex],
				nextPlayer:playersName[nextPlayerIndex]
			};
			console.log("New game : " + JSON.stringify(data));
			socket.broadcast.emit("newgamecreated", data);
			callback(data);
		});

		socket.on("getcard", function(callback){
			//Only the dealer can get card
			// if (Object.keys(players).indexOf(socket.id) === dealerIndex)
			// {
				nextDealerIndex = (nextDealerIndex + 1) % Object.keys(players).length;
				
				var c = getCard();
				callback(c);
			// }
		});

		socket.on("displaycard", function(callback){
			var playersName = Object.values(players);
			nextPlayerIndex = (nextPlayerIndex + 1) % playersName.length;
			// console.log("displaycard",nextPlayerIndex, nextDealerIndex);
			if (nextPlayerIndex === dealerIndex)
			{
				nextPlayerIndex = (nextPlayerIndex + 1) % playersName.length;
			}

			var data = {
				card: currentCard,
				nextPlayer: playersName[nextPlayerIndex]
			}
			socket.broadcast.emit("newdisplayedcard", data);
			callback(data);
		});

		socket.on("notfound", function(callback){
			errorCount++ ; 
			if(errorCount >= 3)
			{
				errorCount = 0 ;
				var ids = Object.keys(players);
				console.log(dealerIndex, nextDealerIndex, nextPlayerIndex);
				dealerIndex = nextDealerIndex;
				nextDealerIndex = (nextDealerIndex + 1) % ids.length;
				var ret = {"name":players[ids[dealerIndex]]};
				console.log("Dealer update", ret);
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