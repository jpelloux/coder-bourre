var name;
var players = [];
var dealer;
var socket = io({transports: ['websocket'], upgrade: false});

var currentCard; 
var htmlDealerToken = "<div id='dealerToken' class='dealerToken'><br/>DEALER</div>";
var htmlPlayerToken = "<div id='playerToken' class='dealerToken'><br/>JOUEUR</div>"

function playerConnection()
{
	name = $("#playerName").val();
	$("#newGameButton").prop("disabled", false);
	$("#connectionButton").html("Actualiser");
	socket.emit("playerconnection", {"name": name}, addPlayers);
}

function startGame(data)
{
	console.log("New game", data);
	players = data.players;
	dealer = data.dealer;
	var nextPlayer = data.nextPlayer;

	$("#pregameLobby").hide(200);
	addPlayersInGame(players, nextPlayer);
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
	names.forEach(e => html += "<li>" + e + "</li>");

	$("#playerList > ul").html(html)
}

function addPlayersInGame(names, nextPlayer)
{
	var html = "";
	players.forEach(function(e){
		html += "<td id='"+e+"'>" + e ;
		if(e === dealer)
		{
			html += htmlDealerToken; ;
		}
		else if (e === nextPlayer)
		{
			html += htmlPlayerToken;
		}
		html += "</td>"
	});
	$("#gamePlayerList").html(html);
}

function newGame()
{
	var dealerChoice = $("input[name='dealerChoice']:checked").val();
	socket.emit("newgame", {dealerChoice: dealerChoice}, startGame);
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
	$("#cardImg").attr("src", "/static/fuckthedealer/img/cartes/" + card[1].toLowerCase() + "-" + card[0]+ ".jpg");
}

function displayCardToEveryone()
{
	socket.emit("displaycard", displayCard);
}

//not dealer game
socket.on("newdisplayedcard", displayCard);

function displayCard(data)
{
	var card = data.card;
	console.log("NEW DISPLAYED CARD", card);
	var id = "#" + card[1].toLowerCase() + "-" + card[0];
	$(id).show(); 
	changePlayerToken(data.nextPlayer);
}

socket.on("dealerupdate", dealerUpdate);

function dealerUpdate(data){
	
	if (data.name !== dealer)
	{
		changeDealerToken(data.name);
		dealer = data.name;
	}
	if (data.name === name)
	{
		$("#dealer").show(200);
		getCard();
	}
	else 
	{
		$("#dealer").hide(200);
	}
}

function changeDealerToken(newDealer)
{
	$("#dealerToken").remove();
	$("#" + newDealer).append(htmlDealerToken);
}

function changePlayerToken(name)
{
	$("#playerToken").remove();
	$("#" + name).append(htmlPlayerToken)
}