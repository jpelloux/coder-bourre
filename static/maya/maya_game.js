/*** INIT ***/
var socket = io();

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
	$(window).attr('location','/maya/home');
}

/*** LISTENERS ***/
$("#choose_call").submit(function(event) {
  	var choosen_dice = [
		$('#dice1').val(),
  		$('#dice2').val()
  	];
  	event.preventDefault();
  	diceCall(choosen_dice);
  	
  	$('#dice1').val("");
	$('#dice2').val("");
});
$("#button_lie").click(function() {
  takeOrLie(false);
});
$("#button_take").click(function() {
  takeOrLie(true);
});
$("#button_copy").click(function() {
  diceCall(turn.dices);
});
$("#button_maya").click(function() {
  diceCall([2,1]);
});
$("#button_51").click(function() {
  socket.emit('51');
});


/*** SOCKETS ***/
socket.on('dices', function(dices){
	console.log(dices);
	turn.dices = dices;
	displayDicesOnElement("#dices", dices);
	displaySpecialAction(dices);
});

socket.on("dispPlayersNames", function(playerNames){
    addPlayer(playerNames);
    checkNbPlayerInRoomplayerNames(playerNames);
});

socket.on("startTurn", function(turnInfos){
    startTurn(turnInfos);
});

socket.on("diceCalled", function(dices){
    displayDicesOnElement("#dicesCalled", dices);
    displayDicesOnChat(dices);
});

socket.on("takeOrLie", function(){
    customShow("#takeOrLie");
});
socket.on("takeOrLieResult", function(choice) {
	displayTakeOrlieOnChat(choice);
});

socket.on("drinks", function(drinks){
    displayDrinks(drinks);
});

socket.on("lied", function(result){
    displayLied(result);
});

socket.on("51", function(){
    display51();
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
function startTurn(turnInfos) {
	clearComp("#dicesCalled");
	customHide("#takeOrLie");
	turn.activePlayer = turnInfos.activPlayer;
	turn.nextActivePlayer = turnInfos.nextActivePlayer;
	$('#active_player_name').html(turnInfos.activPlayer);
	coloration("#active_player_name", turnInfos.activPlayer)
	$('#next_active_player_name').html(turnInfos.nextActivePlayer);
	coloration("#next_active_player_name", turnInfos.nextActivePlayer)
	if (turnInfos.activPlayer == pseudo) {
		customShow("#your_turn", "block");
		customShow("#your_call");
	} else {
		customHide("#your_turn");
	}
}

function diceCall(choosen_dice) {
	customHide("#your_call");
	socket.emit('diceCall', choosen_dice);
}
function takeOrLie(choice) {
	customHide("#takeOrLie");
	socket.emit('takeOrLie', choice);
}

function isMaya(dices) {
	return (dices[0] == 2 && dices[1] == 1) || (dices[0] == 1 && dices[1] == 2);
}
function isDouble(dices) {
	return dices[0] == dices[1];
}
function is51(dices) {
	return (dices[0] == 5 && dices[1] == 1) || (dices[0] == 1 && dices[1] == 5);
}

/*** DISPLAYS ***/
function displaySpecialAction(dices) {
	if (is51(dices)) {
		customShow("#button_51");
		customHide("#choose_call");
		customHide("#specialAction");
	} else {
		customHide("#button_51");
		customShow("#specialAction");
		customShow("#choose_call");
	}
}
function display51() {
	$('#sip_table tr:last').after("<tr><td>" + turn.activePlayer + " : 51 ! Tout le monde boit</td></tr>");
	coloration('#sip_table tr:last', null, true);
}
function displayLied(result) {
	var str;
	if (result) {
		str = " a menti";
	} else {
		str = " n'a pas menti";
	}
	
	$('#sip_table tr:last').after("<tr><td>" + turn.activePlayer + str + "</td></tr>");
	coloration('#sip_table tr:last', turn.activePlayer);
}
function displayDicesOnChat(dices) {
	diceStr = diceParser(dices)
	$('#sip_table tr:last').after("<tr><td>" + turn.activePlayer + " annonce " + diceStr + "</td></tr>");
	coloration('#sip_table tr:last', turn.activePlayer);
}
function diceParser(dices) {
	if (isDouble(dices)) {
		return "double " + dices[0];
	} else if (isMaya(dices)){
		return "maya !";
	}
	return "" + dices[0] + dices[1];
}
function displayTakeOrlieOnChat(choice) {
	var str;
	if (choice) {
		str = " prend.";
	} else {
		str = " : MENTEUR !";
	}
	$('#sip_table tr:last').after("<tr><td>" + turn.nextActivePlayer + str + "</td></tr>");
	coloration('#sip_table tr:last', turn.nextActivePlayer);
}
function displayDrinks(drinks) {
	drinks.forEach(drink => {
		var sip = "";
		var bottomUp = "";
		if (drink.sip != 0) {
			sip = "boit " + drink.sip +  " gorgée"
			if (drink.sip >1) {
				sip += "s";
			}
		}
		if (drink.bottomUp != 0) {
			if (drink.sip != 0) {
				bottomUp = " et ";
			}
			bottomUp = "boit " + drink.bottomUp + " cul sec"	
		}
		$('#sip_table tr:last').after("<tr><td>" + drink.player + " " + sip + bottomUp + "</td></tr>");
		coloration('#sip_table tr:last', drink.player);
	});
	
}
function displayDicesOnElement(comp, dices) {
	clearComp(comp);
	var special = "";
	if (isMaya(dices)) {
		special ="-red";
	}
	if (is51(dices)) {
		special ="-yellow";
	}
	if (isDouble(dices)) {
		special ="-blue";
	}
	dices.forEach(dice => {
        $(comp).append('<img id="dices_img" src=\"/static/img/dices/dice-' + dice + special + '.png\">' + '\t');
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