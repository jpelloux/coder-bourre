var express = require('express');
var path = require('path');
var router = express.Router();
var players = {};

var cards = [];
var currentCard ; 
var errorCount;
var removedCards = [];

/**
 * "6":[false, false, false, false],
	"7":[false, false, false, false],
	"8":[false, false, false, false],
	"9":[false, false, false, false],
	"10":[false, false, false, false],
	"V":[false, false, false, false],
	"D":[false, false, false, false],
	"R":[false, false, false, false],
	"1":[false, false, false, false]
 */

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
		
		socket.on("disconnect", function () {
			console.log("Disconnect from : ", players[socket.id]);
			delete players[socket.id];
		});
	
		socket.on("newgame", function(name, callback){
			cards = generateAllCards();
			errorCount = 0;
			
			console.log("new game from ", name);
			var data = {
				players: Object.values(players),
				dealer:name		
			};
			socket.broadcast.emit("newgamecreated", data);
			callback(data);
		});

		socket.on("getcard", function(callback){
			var c = getCard();
			callback(c);
		});

		socket.on("displaycard", function(callback){
			socket.broadcast.emit("newdisplayedcard", currentCard);
			callback(currentCard);
		});

		socket.on("notfound", function(){
			errorCount++ ; 
			if(errorCount >= 3)
			{
				//TODO NEXT DEALER + NEXT PLAYER
			}
			
		});

		router.get('/', function (req, res, next) {
			res.sendFile("fuckthedealer.html",  {root:'./views'});
		});
	});
	return router;
}

function generateAllCards()
{
	console.log("Generating cards");
	var symbol = ["PIQUE", "TREFLE", "COEUR", "CARREAU"];
	var value = ["2", "3", "4", "5"];
	// var value = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "V", "D", "R", "A"];
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