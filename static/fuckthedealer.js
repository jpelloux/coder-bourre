var name;
var players = [];
var dealer;
var socket = io({transports: ['websocket'], upgrade: false});

var currentCard; 
console.log(socket.id);


function playerConnection()
{
	name = $("#playerName").val();
	socket.emit("playerconnection", {"name": name}, addPlayers);
}

function startGame(data)
{
	console.log("New game", data);
	players = data.players;
	dealer = data.dealer;
	$("#pregameLobby").hide(200);
	$("#game").show(200);
	if (dealer === name)
	{
		$("#dealer").show(200);
		getCard();
	}
	else
	{
		$("#dealer").hide(200);
	}
}

function addPlayers(names)
{
	var html = "";
	players = names;
	names.forEach(e => html += e + "<br>")

	$("#playerList").html(html)
}

function newGame()
{
	socket.emit("newgame", name, startGame);
}

socket.on("playerupdate", addPlayers);

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
	socket.emit("notfound", dealerUpdate)
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
	$("#card").html(card[0] + " - " + card[1]);
}

function displayCardToEveryone()
{
	socket.emit("displaycard", displayCard);
}

//not dealer game
socket.on("newdisplayedcard", displayCard);

function displayCard(card)
{
	console.log("NEW DISPLAYED CARD", card);
	var id = "#" + card[0]; 
	$(id).html($(id).html() + "<br/>" + card[1]); 
}

socket.on("dealerupdate", dealerUpdate);

function dealerUpdate(data){
	if (data.notMe)
	{
		$("#dealer").hide(200);
	}
	else 
	{
		$("#dealer").show(200);
		getCard();
	}
}