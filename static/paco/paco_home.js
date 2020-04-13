var socket = io('/home');

$('#form').submit(function(){
    var pseudo = $('#pseudo').val();
    sessionStorage.setItem('pseudo', pseudo);
    socket.emit("playingRequest", pseudo, function(accesDenied){
        if(accesDenied){
            alert("Pseudo indisponible");
            return;
        }
        window.location.href = "/paco/game";
    })
    
    
});
