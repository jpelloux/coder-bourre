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
    const nsp = io.of('/game');


    io.on('connection', function(socket) { 
        // prevent user to choose an unavaiable pseudo
        socket.on("playingRequest", function(pseudo, fn){
            fn(gameInfos.players.includes(pseudo));
        })
    })

    nsp.on('connection', function(socket) { 
        /**
         * Répondre à la socket :                           socket.emit('', '');
         * Répondre à tout le monde sauf l'emetteur :       ?
         * Répondre à tout le monde :                       nsp.emit('', '');
         * Répondre à tout le monde même hors namespace :   io.emit('');
         */
        
        // store informations when a new player reach the game, then broadcast the info
        socket.on('gameReached', function(player, fn){
            if(!gameInfos.players.includes(player)){ // manage users who press f5 during game (shitty way)
                gameInfos.players.push(player);
            }
            nsp.emit('updatePlayersList', gameInfos.players);
            fn(gameInfos.players);
        });

        socket.on('startGame_req', function(player, fn){
            nsp.emit('startGame_res', '');
        });

        socket.on('getDices', function(m){
            socket.emit('getDices', getDices(5));
            gameInfos.nbReadyPlayers++;
            if (gameInfos.nbReadyPlayers == gameInfos.players.length){
                gameInfos.turn = Math.floor(Math.random() * gameInfos.players.length);
                nsp.emit('startGame', gameInfos.players[gameInfos.turn]);
            }
        });
    
        socket.on('callMade', function(m){
            gameInfos.turn += 1;
            gameInfos.turn %= gameInfos.players.length;
            var call = m[1] + '_' + m[2]
            var disp = m[0] + ' annonce ' + m[1] + ' ' + m[2];
            nsp.emit('callMade', {"toDisp": disp, "call": call, "player":gameInfos.players[gameInfos.turn]});
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
