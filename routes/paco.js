var express = require('express');
var path = require('path');
var router = express.Router();
var io = null;

var gameInfos = {
    "players": [],
    "nbReadyPlayers": 0,
    "turn": 0
};

function main(io){

    io.on('connection', function(socket) {

        socket.on('playRequest', function(m){
            gameInfos.players.push(m)
            socket.broadcast.emit('newPlayer', m);
            if (gameInfos.players.length > 1){
                io.sockets.emit('canDispGame', '');
            }
        });

        socket.on('reachGame', function(m){
            socket.emit('dispPlayersNames', gameInfos.players);
        });
    
        socket.on('getDices', function(m){
            socket.emit('getDices', getDices(5));
            gameInfos.nbReadyPlayers++;
            if (gameInfos.nbReadyPlayers == gameInfos.players.length){
                gameInfos.turn = Math.floor(Math.random() * gameInfos.players.length);
                io.sockets.emit('startGame', gameInfos.players[gameInfos.turn]);
            }
        });
    
        socket.on('callMade', function(m){
            gameInfos.turn += 1;
            gameInfos.turn %= gameInfos.players.length;
            var call = m[1] + '_' + m[2]
            var disp = m[0] + ' annonce ' + m[1] + ' ' + m[2];
            io.sockets.emit('callMade', {"toDisp": disp, "call": call, "player":gameInfos.players[gameInfos.turn]});
        });
    })

    router.get('/home', function(req, res){  
        res.sendFile("paco/paco_home.html",  {root:'./views'});
    })
    .get('/game', function(req, res){
        res.sendFile("paco/paco_game.html",  {root:'./views'});
    });

    return router;
}

function getDices(nbDices){
    var values = [];
        for (var j=0; j<nbDices; j++){
            values.push(Math.floor(Math.random() * Math.floor(6)) + 1);
        }
    return values;
}

module.exports = main;
