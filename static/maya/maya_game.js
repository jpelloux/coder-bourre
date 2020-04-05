var socket = io();
var pseudo = sessionStorage.getItem('pseudo');

socket.emit('reachGame', pseudo, addPlayer);

$('#getDices').click(function(){
	console.log(pseudo + " roll dices");
    //socket.emit('getDices', '');
    //$('#getDices').prop('disabled', true);
});
socket.on("startGame", function(data) {
	debugger;
	console.log("startGame");
	socket.emit('newTurn', null, startTurn);
});

socket.on("dispPlayersNames", function(playerNames){
    console.log(playerNames);
    playerNames.forEach(playersName => {
    	$('#players_tables tr').append('<td>'+playersName+'</td>');
    });
});

socket.on('dices', function(dices){
	console.log(dices);
    dices.forEach(dice => {
        $('#dices').append('<img id="dices_img" src=\"/static/img/dices/dice-' + dice + '.png\">' + '\t');
    });
});

socket.on("dispPlayersNames", function(playerNames){
    addPlayer(playerNames);
});

socket.on("startTurn", function(turnInfos){
    addPlayer(playerNames);
});

function addPlayer(playerNames) {
    console.log(playerNames);
    $("#players_tables").html("<tr></tr>");
        playerNames.forEach(playersName => {
            $('#players_tables tr').append('<td><img id="player_pict" src="/static/img/utils/player.jpg"></img>'+playersName+'</td>');
    });
}

function startTurn(turnInfos) {
	$('#active_player_name').html(turnInfos.activPlayer);
	$('#next_active_player_name').html(turnInfos.nextActivePlayer);
}