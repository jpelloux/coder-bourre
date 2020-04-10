/*** INIT ***/
var socket = io('/coinche');

var pseudo = sessionStorage.getItem('pseudo');
var roomName = sessionStorage.getItem('roomName');
var gameStarted = false;

var turn = {
	"activePlayer": "",
	"nextActivePlayer": "",
	"dices" : []
}

var teamCounter = {
	"team1": 0,
	"team2": 0
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
	$(window).attr('location','/coinche/home');
}

/*** LISTENERS ***/
$('#team1').click(function(event){
	if (teamCounter["team1"] < 2) {
		choiceTeam("team1");
	}
});
$('#team2').click(function(event){
	if (teamCounter["team2"] < 2) {
		choiceTeam("team2");
	}
});
$('#startGame_button').click(function(event){
	socket.emit('startGame');
});

/*** SOCKETS ***/
socket.on("dispPlayersNames", function(data){
	addPlayer(data);
    checkNbPlayerInRoomplayerNames(data);
    dispTeams(data);
});
socket.on("hand", function(cards){
	displayHand(cards);
});
socket.on("lobbyFull", function() {
	$(window).attr('location','/coinche/home');
});
socket.on("startGame", function() {
	gameStarted= true;
});

/*** GAME LOGIQUE ***/
function addPlayer(datas) {
    $("#players_tables").html("<tr></tr>");
    datas.forEach(data => {
        $('#players_tables tr').append('<td><img id="player_pict" src="/static/img/utils/player.jpg"></img>'+ data.name +'</td>');
    });
}
function checkNbPlayerInRoomplayerNames(data) {
	if (gameStarted) {
		customHide("#waitingScreen");
		customHide(".players_fieldset");
		customHide("#startGame_button");
		customShow("#game", "block");
	} else {
		customHide("#game");
		customShow("#waitingScreen", "block");
		customShow(".players_fieldset");
		customHide("#startGame_button");
	}
}
function choiceTeam(team) {
	socket.emit('teamJoined', team);
}
/*** DISPLAYS ***/
function displayHand(cards) {
    $("#hand_table").html("<tr></tr>");
    cards.forEach(cardName => {
        $('#hand_table tr').append('<td id="hand_td"><img id="hand_card" src="/static/img/cards/' + cardName +'.jpg"></img></td>');
    });
}
function coloration(comp, currentName, force) {
	if (currentName	== pseudo || force) {
		console.log("itsYou");
		$(comp).addClass("you");
	}  else {
		console.log("itsNotYou");
		$(comp).removeClass("you");
	}
}
function dispTeams(datas) {
	teamCounter = {
		"team1": 0,
		"team2": 0
	}
	customHide("#startGame_button");
	$("#team1").html("<tr></tr>");
	$("#team2").html("<tr></tr>");
    datas.forEach(data => {
    	if (data.team) {
			teamCounter[data.team]++
    		$('#'+data.team).append('<span id="team_"'+data.name + '">' + data.name + '</span></br>');
        	coloration("team_"+data.name, data.name);
    	}
    });
    if (teamCounter["team1"] == 2 && teamCounter["team2"] == 2) {
		customShow("#startGame_button");
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