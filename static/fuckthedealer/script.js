var name;
var players = [];
var dealer;
var nextPlayer; 
var socket = io({transports: ['websocket'], upgrade: false});

var currentCard;
var htmlDealerToken = "<div id='dealerToken' class='dealerToken'><br/>DEALER</div>";
var htmlPlayerToken = "<div id='playerToken' class='dealerToken'><br/>JOUEUR</div>"

var listOfPlayersTemplate = "<div class='game'></div>"

var colorLogoHtml = {
	"CARREAU": "<img src='/static/fuckthedealer/img/cartes/carreau.png'></img>",
	"TREFLE": "<img src='/static/fuckthedealer/img/cartes/trefle.png'></img>",
	"PIQUE": "<img src='/static/fuckthedealer/img/cartes/pique.png'></img>",
	"COEUR": "<img src='/static/fuckthedealer/img/cartes/coeur.png'></img>",
}




function playerConnection()
{
	name = $("#playerName").val();
	// $("#newGameButton").prop("disabled", false);
	// $("#connectionButton").html("Actualiser");
	socket.emit("playerconnection", {"name": name}, function(data){
		$("#pseudoInput").hide(200);
		$("#activeGamesContainer").show(200);
		displayRooms(data);
	});
}

function displayRooms(data)
{
	$("#activeGames").html("");
	for(var i in data){
		if (data[i].owner === socket.id)
		{
			$("#playerList").html("<ul></ul>");
			var html = "";
			data[i].players.forEach(p => html += "<li>" + p + "</li>");
			$("#playerList > ul").append(html);
			continue;
		}
		var html = "<div class='gameRoom'>"
		html += "<h3>" + data[i].name + "</h3>"
		html += "<ul>"
		data[i].players.forEach(p => html += "<li>" + p + "</li>");
		html += "</ul>";
		html += "<button id='"+ i +"' onclick='joinRoom(this)'>Rejoindre</button></div>"
		$("#activeGames").append(html)
	}
}

socket.on("updaterooms", displayRooms);

function joinRoom(btn)
{
	console.log(btn);
	socket.emit("joinroom", {id:btn.id, name:name}, function(data){
		if (!data.ok)
		{
			if (confirm("Vous etes propriétaire d'une partie qui va se lancer, voulez vous l'annuler et changer de partie ?"))
			{
				$("#playerList").html("<ul></ul>");
				$("#pregameLobby").hide(100);
				socket.emit("deleteroom", {id:btn.id, name:name});
			}
		}
	});
}

function displayNewRoomHTML()
{
	$("#roomName").val("Partie de "+name);
	$("#pregameLobby").show(200);
}

function createRoom()
{
	var roomName = $("#roomName").val();
	$("#roomName").prop('readonly', true);
	$("#waitingPlayers").show();
	$("#newRoomButton").hide();
	$("#newGaleButton").show();
	socket.emit("newroom", {"name": roomName, "by":name});
}

function startGame(data)
{
	var dealerChoice = $("input[name='dealerChoice']:checked").val();
	var nextDealerChoice = $("input[name='nextDealerChoice']:checked").val();
	socket.emit("startgame", {dealerChoice: dealerChoice, nextDealerChoice: nextDealerChoice});
	// players = data.players;
	// dealer = data.dealer;
	// nextPlayer = data.nextPlayer;



	// $("#pregameLobby").hide(200);
	// addPlayersInGame();
	// $("#game").show(200);
	// if (dealer === name)
	// {
	// 	$("#dealer").show(200);
	// }
	// else
	// {
	// 	$("#dealer").hide(200);
	// }
}

function gameStarted(data)
{
	$("#home").hide();
	console.log("Game started ! ", data)
	players = data.players;
	dealer = data.dealer;
	nextPlayer = data.nextPlayer;

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

socket.on("gamestarted", gameStarted);

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
	displayCard(data.newDisplayedCard, data.isLastCardFromFamily);
}

function displayCard(card, isLastCardFromFamily)
{
	var id = "#" + card[1] + "-" + card[0];
	$(id).append(colorLogoHtml[card[1]]);

	if(isLastCardFromFamily)
	{
		$("td[id$='-"+ card[0] +"']").css("background-color", "#bfbfbf");
	}
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