var socket = io('/drinkingWar');

customHide("#newRoomDiv");
socket.emit('lobbyJoined');

/*** LISTENERS ***/
$('#playing_request').click(function(event){
    var pseudo = $('#pseudo').val();
    var roomName = $('input[name="room"]:checked').val();
    if (roomName =="newRoom") {
        roomName = $('#newRoomName').val();
    }  
    if (roomName == "") {
        roomName = pseudo;
    }
    sessionStorage.setItem('pseudo', pseudo);
    sessionStorage.setItem('roomName', roomName);
    cbGoToGame();
    event.preventDefault();
});
$('#rooms').on('click', '.room', function() {
    if (this.value == 'newRoom') {
        customShow("#newRoomDiv");
        $("#newRoomName").attr("required", "true");
    } else {
        customHide("#newRoomDiv");
        $("#newRoomName").attr("required", "false");
    }
});

/*** SOCKETS ***/
socket.on("needToRefreshRoom", function(){
    socket.emit('getRoomsAndPlayers', null, cbRoomsAndPlayers);
})


/*** CALLBACK ***/
function cbRoomsAndPlayers(roomsAndPlayers) {
    debugger;
    clearComp("#rooms_list");
    var rooms = Object.entries(roomsAndPlayers).filter(([clé, valeur]) => {
        return clé.includes("drinkingWar_game");
    });
    rooms.forEach(room => { 
        displayRooms(roomNameParser(room[0]), room[1]["length"]);
    });
}
function cbGoToGame() {
    $(window).attr('location','/drinkingWar/game');
}

/*** GAME ***/
function displayRooms(roomName, nbPlayers) {
    var displayName = roomName + " <i>(" + nbPlayers + " joueurs)</i>";
    $('#rooms_list').append('<input type="radio" id="' + roomName+ '" name="room" value="' + roomName + '" class="room" required><label for="' + roomName + '">' + displayName + '</label><br>');
}
function roomNameParser(roomName) {
    var name = roomName.split("drinkingWar_game_");
    name.shift();
    return name.toString();
}


/*** UTILS ***/
function customHide(comp) {
    console.log("hide : " + comp);
    $(comp).css('display','none');
}

function customShow(comp) {
    console.log("show : " + comp);
    $(comp).css('display','inline-block');
}
function clearComp(comp) {
    $(comp).html("");
}