var express = require('express');
var router = express.Router();
var players = {};
var dealerIndex; 
var nextDealerIndex; 
var nextPlayerIndex; 
var playersCount;
var cards = [];
var currentCard ; 
var errorCount;
var isNextDealerChoiceIsNextPlayer;
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
			var ids = Object.keys(players);
			playersCount = playersName.length ; 
			errorCount = 0;
			if (clientData.dealerChoice === "player") {
				dealerIndex = ids.indexOf(socket.id);
			}
			else {
				dealerIndex = Math.floor(Math.random() * playersCount)
			}
			isNextDealerChoiceIsNextPlayer = clientData.nextDealerChoice === "nextPlayer" ;
			nextPlayerIndex = (dealerIndex + 1) % playersCount;
			var data = {
				players: playersName,
				dealer:playersName[dealerIndex],
				nextPlayer:playersName[nextPlayerIndex]
			};
			console.log("New game : " + JSON.stringify(data));
			io.emit("newgamecreated", data);
			var c = getCard();
			io.to(ids[dealerIndex]).emit("cardreceive", c)
			
		});

		//Update from dealer when clicking on found/notFound
		socket.on("clientupdate", function(data, callback){
			var ret = {
				newDisplayedCard: null,
				isLastCardFromFamily: null,
				dealer: null,
				nextDealer: null,
				nextPlayer: null
			}
			var ids = Object.keys(players);
			var names = Object.values(players);
			if (data.found)
			{
				errorCount = 0;				
			}
			else
			{
				errorCount++ ; 
				if(errorCount >= 3)
				{
					errorCount = 0 ;
					if (isNextDealerChoiceIsNextPlayer)
					{
						dealerIndex = (dealerIndex + 1) % playersCount;
					}
					else
					{
						dealerIndex = nextPlayerIndex;
					}
				}
			}
			nextPlayerIndex = (nextPlayerIndex + 1) % playersCount;
			if (nextPlayerIndex === dealerIndex)
			{
				nextPlayerIndex = (nextPlayerIndex + 1) % playersCount;
			}
			ret.newDisplayedCard = currentCard; 
			ret.dealer = names[dealerIndex] ;
			ret.nextPlayer = names[nextPlayerIndex];
			io.emit("serverupdate", ret);
			
			var c = getCard();
			io.to(ids[dealerIndex]).emit("cardreceive", c);		
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