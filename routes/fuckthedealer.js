var express = require('express');
var router = express.Router();
var players = {};
var dealerIndex; 
var nextPlayerIndex; 
var playersCount;
var cards = [];
var currentCard ; 
var errorCount;
var isNextDealerChoiceIsNextPlayer;
var removedCards;
//TODO : Add flag for active game
/**
 * var rooms = {
	"room1": {
		name:"Partie de Un",
		owner:"fdshfd",
		players: {
			"fdshfd": "Un",
			"poiu": "Deux",
			"dmslkjdsdfjk": "Trois"
		}
	},
	"room2": {
		name:"Partie de One",
		owner:"fdmoiljfd",
		players: {
			"fdmoiljfd": "One",
			"mldskfdfj": "Two",
			"fklmdsjfe": "Three"
		}
	}
}
 */

var rooms = {}

function main(io)
{
	io.on("connection", function(socket){
		console.log("FTD connection handling", socket.id);

		socket.on("playerconnection", function(data, callback){
			
			console.log("Player connection : ", data.name);
			callback(getPlayersbyRooms());
		});

		socket.on("newroom", function(data){
			//TODO : Disconnect from previous room
			var roomId = "room" + data.name.replace(/ /g, "");
			var s_id = socket.id;
			rooms[roomId] = {
				name: data.name,
				owner:socket.id,
				players: {
					[s_id]:data.by
				}
			}
			console.log("Room created : ", rooms[roomId]);
			io.emit("updaterooms", getPlayersbyRooms());
		});

		socket.on("joinroom", function(data, callback){
			//check if owner of a room
			for(var i in rooms)
			{
				if(rooms[i].owner === socket.id)
				{
					callback({"ok":false, "reason":"owner"});
					return;
				}
			}
			//Duplicate code with deleteroom
			//Remove from previous room
			for(var i in rooms){
				delete rooms[i].players[socket.id]
			}
			rooms[data.id].players[socket.id] = data.name
			io.emit("updaterooms", getPlayersbyRooms());
			callback({"ok":true});
		});

		socket.on("deleteroom", function(data){
			for (var i in rooms)
			{
				if(rooms[i].owner === socket.id)
				{
					delete rooms[i];
				}
			}
			//Duplicate code from joinroom
			//Remove from previous room
			for(var i in rooms){
				delete rooms[i].players[socket.id]
			}
			//Add in the new one
			rooms[data.id].players[socket.id] = data.name
			io.emit("updaterooms", getPlayersbyRooms());
		});
		
		socket.on("disconnect", function () {
			console.log("A player as disconnected")
			for (var i in rooms)
			{
				if(rooms[i].owner === socket.id)
				{
					delete rooms[i];
				}
			}
			//Remove from previous room
			for(var i in rooms){
				delete rooms[i].players[socket.id]
			}
			io.emit("updaterooms", getPlayersbyRooms());
		});

		socket.on("startgame", function(clientData){
			for(var i in rooms)
			{
				if (rooms[i].owner === socket.id)
				{
					var ids = Object.keys(rooms[i].players);
					var names = Object.values(rooms[i].players);
					rooms[i].playersCount = ids.length
					rooms[i].cards = generateAllCards();
					rooms[i].currentCard = null;
					rooms[i].removedCards = [];
					rooms[i].errorCount = 0;
					rooms[i].isNextDealerChoiceIsNextPlayer = clientData.nextDealerChoice === "nextPlayer";
					
					if (clientData.dealerChoice === "player") {
						rooms[i].dealerIndex = ids.indexOf(socket.id);
					}
					else {
						rooms[i].dealerIndex = Math.floor(Math.random() * rooms[i].playersCount)
					}
					rooms[i].nextPlayerIndex = (rooms[i].dealerIndex + 1) % rooms[i].playersCount;
					console.log("Starting game : ", rooms[i]);
					var ret = {
						players:names,
						dealer:names[rooms[i].dealerIndex],
						nextPlayer:names[rooms[i].nextPlayerIndex]
					}
					for(var s_id in rooms[i].players)
					{
						io.to(s_id).emit("gamestarted", ret);
					}
					var c = getCard(rooms[i]);
					io.to(ids[rooms[i].dealerIndex]).emit("cardreceive", c)
					
				}
			}
		});

		//Update from dealer when clicking on found/notFound
		socket.on("clientupdate", function(data, callback){
			var room = getRoomFromPlayerId(socket.id);
			var ret = {
				newDisplayedCard: null,
				isLastCardFromFamily: null,
				dealer: null,
				nextDealer: null,
				nextPlayer: null
			}
			var ids = Object.keys(room.players);
			var names = Object.values(room.players);
			if (data.found)
			{
				room.errorCount = 0;				
			}
			else
			{
				room.errorCount++ ; 
				if(room.errorCount >= 3)
				{
					room.errorCount = 0 ;
					if (room.isNextDealerChoiceIsNextPlayer)
					{
						room.dealerIndex = (room.dealerIndex + 1) % room.playersCount;
					}
					else
					{
						room.dealerIndex = room.nextPlayerIndex;
					}
				}
			}
			room.nextPlayerIndex = (room.nextPlayerIndex + 1) % room.playersCount;
			if (room.nextPlayerIndex === room.dealerIndex)
			{
				room.nextPlayerIndex = (room.nextPlayerIndex + 1) % room.playersCount;
			}
			ret.isLastCardFromFamily = isLastCardFromFamilyRemoved(room, room.currentCard);
			ret.newDisplayedCard = room.currentCard; 
			ret.dealer = names[room.dealerIndex] ;
			ret.nextPlayer = names[room.nextPlayerIndex];
			io.emit("serverupdate", ret);
			
			var c = getCard(room);
			io.to(ids[room.dealerIndex]).emit("cardreceive", c);	
		});

	});
	router.get('/', function (req, res, next) {
		res.sendFile("fuckthedealer.html",  {root:'./views/fuckthedealer'});
	});

	return router;
}

function getRoomFromPlayerId(s_id)
{
	for(var i in rooms)
	{
		if (Object.keys(rooms[i].players).some(e => e === s_id))
		{
			return rooms[i];
		}
	}
}

function getPlayersbyRooms()
{
	var ret = {}
	for(var roomId in rooms)
	{
		ret[roomId] = {
			name: rooms[roomId].name,
			owner: rooms[roomId].owner,
			players:Object.values(rooms[roomId].players)
		}
	}
	return ret;
}

function isLastCardFromFamilyRemoved(room, card)
{	
	//temporary solution in order to not crash when no card left
	if (card)
	{
		return room.removedCards.filter(e => e[0] === card[0]).length === 4;
	}
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

function getCard(room)
{
	var cards = room.cards
	let r = Math.floor(Math.random() * Math.floor(cards.length));
	let card = cards.splice(r, 1)[0];
	room.removedCards.push(card);
	room.currentCard = card;
	return card;
}

module.exports = main;