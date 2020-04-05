var socket = io();

$('#playing_request').click(function(){
    var pseudo = $('#pseudo').val();
    sessionStorage.setItem('pseudo', pseudo);
    socket.emit('playRequest', pseudo, addPlayer);
    $('#text_area').prepend('<p>Vous (' + pseudo + ') avez demandé à rejoindre la partie</p>');
    $('#playing_request').prop('disabled', true);
});

$('#game_starter').click(function(){
    socket.emit('goToGame', null, goToGame);
});

socket.on("newPlayer", function(m){
    $('#text_area').append('<p>' + m + ' a demandé à rejoindre la partie</p>');
})
socket.on("removePlayer", function(m){
    $('#text_area').append('<p>' + m + ' a quitter partie</p>');
})

socket.on("canDispGame", function(m){
    $('#game_starter').prop('disabled', false);
})

socket.on("dispPlayersNames", function(playerNames){
    addPlayer(playerNames);
});

socket.on("goToGame", function() {
    goToGame();
});

function goToGame() {
    $(window).attr('location','/maya/game');
}

function addPlayer(playerNames) {
    console.log(playerNames);
    $("#players_tables").html("<tr></tr>");
        playerNames.forEach(playersName => {
            $('#players_tables tr').append('<td><img id="player_pict" src="/static/img/utils/player.jpg"></img>'+playersName+'</td>');
    });
}