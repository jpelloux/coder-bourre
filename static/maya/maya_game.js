var socket = io();
var pseudo = sessionStorage.getItem('pseudo');

if (pseudo) {
	socket.emit('reachGame', pseudo, addPlayer);
} else {
	$(window).attr('location','/maya/home');
}

$("#choose_call").submit(function(event) {
  	var choosen_dice = [
		$('#dice1').val(),
  		$('#dice2').val()
  	];
  	event.preventDefault();
  	diceCall(choosen_dice);
  	customHide("#your_call");
  	$('#dice1').val("");
	$('#dice2').val("");
});
$("#button_lie").click(function() {
  takeOrLie(false);
});
$("#button_take").click(function() {
  takeOrLie(true);
});

socket.on("dispPlayersNames", function(playerNames){
    console.log(playerNames);
    playerNames.forEach(playersName => {
    	$('#players_tables tr').append('<td>'+playersName+'</td>');
    });
});

socket.on('dices', function(dices){
	console.log(dices);
	displayDicesOnElement("#dices", dices);
});

socket.on("dispPlayersNames", function(playerNames){
    addPlayer(playerNames);
});

socket.on("startTurn", function(turnInfos){
    startTurn(turnInfos);
});

socket.on("diceCalled", function(dices){
    displayDicesOnElement("#dicesCalled", dices);
});

socket.on("takeOrLie", function(dices){
    customShow("#takeOrLie");
});

socket.on("drinks", function(drinks){
    displayDrinks(drinks);
});

function addPlayer(playerNames) {
    console.log(playerNames);
    $("#players_tables").html("<tr></tr>");
        playerNames.forEach(playersName => {
            $('#players_tables tr').append('<td><img id="player_pict" src="/static/img/utils/player.jpg"></img>'+playersName+'</td>');
    });
}

function startTurn(turnInfos) {
	clearComp("#dicesCalled");
	customHide("#takeOrLie");
	$('#active_player_name').html(turnInfos.activPlayer);
	coloration("#active_player_name", turnInfos.activPlayer)
	$('#next_active_player_name').html(turnInfos.nextActivePlayer);
	coloration("#next_active_player_name", turnInfos.nextActivePlayer)
	if (turnInfos.activPlayer == pseudo) {
		customShow("#your_turn");
		customShow("#your_call");
	} else {
		customHide("#your_turn");
	}
}
function coloration(comp, currentName) {
	if (currentName	== pseudo) {
		console.log("itsYou");
		$(comp).addClass("you");
	}  else {
		console.log("itsNotYou");
		$(comp).removeClass("you");
	}
}
function diceCall(choosen_dice) {
	socket.emit('diceCall', choosen_dice);
}

function customHide(comp) {
	console.log("hide : " + comp);
	$(comp).css('display','none')
}

function customShow(comp) {
	console.log("show : " + comp);
	$(comp).css('display','inline-block')
}

function displayDicesOnElement(comp, dices) {
	clearComp(comp);
	dices.forEach(dice => {
        $(comp).append('<img id="dices_img" src=\"/static/img/dices/dice-' + dice + '.png\">' + '\t');
    });
}
function takeOrLie(choice) {
	customHide("#takeOrLie");
	socket.emit('takeOrLie', choice);
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
function clearComp(comp) {
	$(comp).html("");
}