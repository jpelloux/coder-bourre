var name;
var players = [];
var socket = io({transports: ['websocket'], upgrade: false});
console.log(socket.id);


function playerConnection()
{
	name = $("#playerName").val();
	socket.emit("playerconnection", {"name": name});
}


function newGame()
{
	socket.emit("newgame", name);
}

socket.on("playerupdate", function(data){
	console.log("Player update", data);
	players = data ;
});

socket.on("newgamecreated", function(data){
	console.log("New game", data);
});