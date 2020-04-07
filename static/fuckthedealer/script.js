var name;
var players = [];
var dealer;
var nextPlayer; 
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
	nextPlayer = data.nextPlayer;

	$("#pregameLobby").hide(200);
	addPlayersInGame();
	$("#game").show(200);
	if (dealer === name)
	{
		$("#dealer").show(200);
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

function addPlayersInGame()
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
	var nextDealerChoice = $("input[name='nextDealerChoice']:checked").val();
	socket.emit("newgame", {dealerChoice: dealerChoice, nextDealerChoice: nextDealerChoice});
}

socket.on("playerupdate", addPlayers);

socket.on("newgamecreated", startGame);

//game as dealer
function found()
{
	socket.emit("clientupdate", {found: true});
}

function notFound()
{
	socket.emit("clientupdate", {found: false});
}


socket.on("serverupdate", onServerUpdate);

function onServerUpdate(data)
{
	changePlayerToken(data.nextPlayer);
	changeDealerToken(data.dealer);
	displayCard(data.newDisplayedCard);
}

function displayCard(card)
{
	console.log("NEW DISPLAYED CARD", card);
	var id = "#" + card[1].toLowerCase() + "-" + card[0];
	$(id).show(); 
}

function changeDealerToken(newDealer)
{
	if (newDealer !== dealer)
	{
		if (dealer === name)
		{
			$("#dealer").hide(200);
		}
		else if (newDealer === name)
		{
			$("#dealer").show(200);	
		}
		dealer = newDealer;
		$("#dealerToken").remove();
		$("#" + dealer).append(htmlDealerToken);
	}
}

function changePlayerToken(name)
{
	if (name !== nextPlayer)
	{
		nextPlayer = name
		$("#playerToken").remove();
		$("#" + name).append(htmlPlayerToken)
	}
}

socket.on("cardreceive", onCardReceived);

function onCardReceived(card)
{
	currentCard = card;
	console.log("CARD GET : ", card);
	$("#cardImg").attr("src", "/static/fuckthedealer/img/cartes/" + card[1].toLowerCase() + "-" + card[0]+ ".jpg");
}

