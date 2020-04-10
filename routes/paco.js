var express = require('express');
var path = require('path');
var router = express.Router();
var io = null;

var gameInfos = {
    "players": [], // pseudos of the differents players
    "nbReadyPlayers": 0, // increment each time someone get his dices, start game when =players.length
    "turn": 0, // used to tell to clients that it's the turn of players[turn]
    "dices": [0, 0, 0, 0, 0, 0] // total of each dice value during a round
};

function main(io){
    const nsp_home = io.of('/home');
    const nsp_game = io.of('/game');


    nsp_home.on('connection', function(socket) { 
        /**
         * Répondre à la socket :                           socket.emit('', '');
         * Répondre à tout le monde sauf l'emetteur :       ?
         * Répondre à tout le monde :                       nsp_game.emit('', '');
         * Répondre à tout le monde même hors namespace :   io.emit('');
         */

        // prevent user to choose an unavaiable pseudo
        socket.on("playingRequest", function(pseudo, fn){
            fn(gameInfos.players.includes(pseudo));
        })
    })




    nsp_game.on('connection', function(socket) { 
        /**
         * Répondre à la socket :                           socket.emit('', '');
         * Répondre à tout le monde sauf l'emetteur :       ?
         * Répondre à tout le monde :                       nsp_game.emit('', '');
         * Répondre à tout le monde même hors namespace :   io.emit('');
         */
        
        // store informations when a new player reach the game, then broadcast the info
        socket.on('gameReached', function(player, fn){
            if(!gameInfos.players.includes(player)){ // manage users who press f5 during game (shitty way tot do that)
                gameInfos.players.push(player);
            }
            nsp_game.emit('updatePlayersList', gameInfos.players);
            fn(gameInfos.players);
        });

        socket.on('dispGame_req', function(){
            gameInfos.turn = Math.floor(Math.random() * gameInfos.players.length);
            nsp_game.emit('dispGame_res', '');
        });

        socket.on('getDices_req', function(nbDice, fn){
            fn(getDices(nbDice));
            gameInfos.nbReadyPlayers++;
            if (gameInfos.nbReadyPlayers == gameInfos.players.length){
                nsp_game.emit('startGame', gameInfos.players[gameInfos.turn]);
            }
        });


        /** "call" is an object which contains : 
         *      - "pseudo" : the pseudo of the last player
         *      - "numberCalled" : the last number of value called
         *      - "valueCalled" : the last value called
        */
        socket.on('callMade_req', function(call){
            gameInfos.turn += 1;
            gameInfos.turn %= gameInfos.players.length;
            nsp_game.emit('callMade_res', {  "lastPlayer": call.pseudo,
                                        "nextPlayer": gameInfos.players[gameInfos.turn], 
                                        "numberCalled": call.numberCalled, 
                                        "valueCalled":call.valueCalled });
        });

        /** "data" is an object which contains :
         *      - "pseudo": the pseudo of the player who ended the game
         *      - "lastPlayer": the pseudo of the player before the one who ended the game
         *      - "enderType": either "menteurButton" or "toutpileButton"
         *      - "numberCalled": the last number of value called
         *      - "valueCalled": the last value called
        */
        socket.on('endRound_req', function(data){
            var hasWin;
            var pseudo;

            var valueCalled = parseInt(data.valueCalled);
            var numberCalled = parseInt(data.numberCalled);

            if(data.enderType=="menteurButton"){
                hasWin = false;
                if(valueCalled!=1){
                    pseudo = gameInfos.dices[valueCalled-1]+gameInfos.dices[0]<numberCalled ? data.lastPlayer : data.pseudo; //if the sum of the actual number of values called and pacos is less than the call, the last player loose
                }else{
                    pseudo = gameInfos.dices[valueCalled-1]<numberCalled ? data.lastPlayer : data.pseudo;
                }
            }else if(data.enderType=="toutpileButton"){
                if(valueCalled!=1){
                    hasWin = gameInfos.dices[valueCalled-1]+gameInfos.dices[0]==numberCalled;
                }else{
                    hasWin = gameInfos.dices[valueCalled-1]==numberCalled;
                }
                pseudo = data.pseudo;
            }else{
                throw "id of enderButton is not recognized";
            }

            nsp_game.emit('endRound_res', {
                "endingPlayer":data.pseudo,
                "enderType": data.enderType,
                "hasWin": hasWin, 
                "pseudo": pseudo, 
                "dices": gameInfos.dices
            });

            gameInfos.nbReadyPlayers=0;
            gameInfos.turn=gameInfos.players.indexOf(pseudo);
            gameInfos.dices=[0, 0, 0, 0, 0, 0];

        });

        socket.on('playerQuit_req', function(pseudo){
            gameInfos.players.splice(gameInfos.players.indexOf(pseudo), 1);
            gameInfos.turn = (gameInfos.turn + 1) % gameInfos.players.length; 
            nsp_game.emit('playerQuit_res', pseudo);
        });

        socket.on('palifico_req', function(){
            nsp_game.emit('palifico_res', '');
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
            var dice = Math.floor(Math.random() * Math.floor(6)) + 1;
            gameInfos.dices[dice-1]++;
            values.push(dice);
        }
    return values;
}

module.exports = main;
