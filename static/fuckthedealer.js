var name;
var players = [];
var dealer;
var socket = io({transports: ['websocket'], upgrade: false});

var currentCard; 
console.log(socket.id);


function playerConnection()
{
	name = $("#playerName").val();
	socket.emit("playerconnection", {"name": name});
}

function startGame(data)
{
	console.log("New game", data);
	players = data.players;
	dealer = data.dealer;
	$("#pregameLobby").hide(200);
	$("#game").show(200);
	(dealer === name) ? $("#dealer").show(200) : $("#dealer").hide(200);
}

function newGame()
{
	socket.emit("newgame", name, startGame);
}

socket.on("playerupdate", function(data){
	console.log("Player update", data);
	players = data ;
});

socket.on("newgamecreated", startGame);

//game as dealer
function found()
{
	displayCardToEveryone();
	getCard();
}

function notFound()
{
	displayCardToEveryone();
}
//called the first time
//maybe use the function found for a new card
function getCard()
{
	socket.emit("getcard", onCardReceived);
}

function onCardReceived(card)
{
	currentCard = card;
	console.log("CARD GET : ", card);
}

function displayCardToEveryone()
{
	socket.emit("displaycard");
}

//not dealer game
socket.on("newdisplayedcard", function(card){
	console.log("NEW DISPLAYED CARD", card);
});