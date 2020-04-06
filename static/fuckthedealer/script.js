var name;
var players = [];
var dealer;
var socket = io({transports: ['websocket'], upgrade: false});

var currentCard; 
var htmlDealerToken = "<br/><span class='dealerToken'>DEALER</span>";


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
	$("#pregameLobby").hide(200);
	addPlayersInGame(players);
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

function addPlayersInGame(names)
{
	var html = ""
	players.forEach(function(e){
		html += "<td id='"+e+"'>" + e ;
		if(e === dealer)
		{
			html += htmlDealerToken; ;
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

function displayCard(card)
{
	console.log("NEW DISPLAYED CARD", card);
	var id = "#" + card[1].toLowerCase() + "-" + card[0];
	$(id).show(); 
}

socket.on("dealerupdate", dealerUpdate);

function dealerUpdate(data){
	
	if (data.name !== dealer)
	{
		changeDealerToken(data.name, dealer);
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

function changeDealerToken(newDealer, oldDealer)
{
	var oldDealerHtml = $("#" + oldDealer).html();
	$("#" + oldDealer).html(oldDealerHtml.substring(0, oldDealerHtml.length - htmlDealerToken.length + 1));
	var newDealerHtml = $("#" + newDealer).html() + htmlDealerToken;
	$("#" + newDealer).html(newDealerHtml);
}