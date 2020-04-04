var socket = io();

$('#playing_request').click(function(){
    var pseudo = $('#pseudo').val();
    sessionStorage.setItem('pseudo', pseudo);
    socket.emit('playRequest', pseudo);
    $('#text_area').prepend('<p>Vous (' + pseudo + ') avez demandé à rejoindre la partie</p>');
    $('#playing_request').prop('disabled', true);
});

socket.on("newPlayer", function(m){
    $('#text_area').append('<p>' + m + ' a demandé à rejoindre la partie</p>');
})

socket.on("canDispGame", function(m){
    $('#game_starter').prop('disabled', false);
})