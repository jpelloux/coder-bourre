var socket = io();


function playerConnection()
{
	var name = $("#playerName").val()
	socket.emit("playerconnection", {"name": name});
}

socket.on("playerupdate", function(data){
	console.log(data);
});