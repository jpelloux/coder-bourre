/*** INIT ***/
var socket = io('/drinkingWar');

var pseudo = sessionStorage.getItem('pseudo');
var roomName = sessionStorage.getItem('roomName');

var turn = {
	"activePlayer": "",
	"nextActivePlayer": "",
	"dices" : []
}

if (pseudo && roomName) {
	var data = {
        "pseudo" : pseudo, 
        "roomName" : roomName
    };
	socket.emit('reachGame', data, addPlayer);
	$("#lobbyName").html(roomName);
	$("#lobbyName_2").html(roomName);
} else {
	$(window).attr('location','/drinkingWar/home');
}

/*** LISTENERS ***/


/*** SOCKETS ***/
socket.on("dispPlayersNames", function(playerNames){
    addPlayer(playerNames);
    checkNbPlayerInRoomplayerNames(playerNames);
});


/*** GAME LOGIQUE ***/
function addPlayer(playerNames) {
    console.log(playerNames);
    $("#players_tables").html("<tr></tr>");
    playerNames.forEach(playersName => {
        $('#players_tables tr').append('<td><img id="player_pict" src="/static/img/utils/player.jpg"></img>'+playersName+'</td>');
    });
}
function checkNbPlayerInRoomplayerNames(playersName) {
	if (playersName.length >= 2) {
		customHide("#waitingScreen");
		customShow("#game", "block");
	} else {
		customHide("#game");
		customShow("#waitingScreen", "block");
	}
}

/*** DISPLAYS ***/
function coloration(comp, currentName, force) {
	if (currentName	== pseudo || force) {
		console.log("itsYou");
		$(comp).addClass("you");
	}  else {
		console.log("itsNotYou");
		$(comp).removeClass("you");
	}
}

/*****   UTILS  ****/
function customHide(comp) {
	console.log("hide : " + comp);
	$(comp).css('display','none')
}

function customShow(comp, style) {
	console.log("show : " + comp);
	style = style ? style : 'inline-block';
	$(comp).css('display', style)
}
function clearComp(comp) {
	$(comp).html("");
}