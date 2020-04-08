var express = require('express');
var path = require('path');
var router = express.Router();
var io = null;

var gameInfos = {
    "players": [],
    "nbReadyPlayers": 0,
    "turn": 0,
    "dices": [0, 0, 0, 0, 0, 0] // total of each dice value during a round
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

        socket.on('getDices_req', function(m){
            socket.emit('getDices_res', getDices(5));
            gameInfos.nbReadyPlayers++;
            if (gameInfos.nbReadyPlayers == gameInfos.players.length){
                gameInfos.turn = Math.floor(Math.random() * gameInfos.players.length);
                nsp.emit('startGame_res', gameInfos.players[gameInfos.turn]);
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
            nsp.emit('callMade_res', {  "lastPlayer": call.pseudo,
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
                pseudo = gameInfos.dices[valueCalled-1]+gameInfos.dices[0]<numberCalled ? data.lastPlayer : data.pseudo; //if the sum of the actual number of values called and pacos is less than the call, the last player loose
            }else if(data.enderType=="toutpileButton"){
                hasWin = gameInfos.dices[valueCalled-1]+gameInfos.dices[0]==numberCalled;
                pseudo = data.pseudo;
            }else{
                throw "id of enderButton is not recognized";
            }

            nsp.emit('endRound_res', {
                "endingPlayer":data.pseudo,
                "enderType": data.enderType,
                "hasWin": hasWin, 
                "pseudo": pseudo, 
                "dices": gameInfos.dices
            });
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
            /*switch(dice){
                case 1: gameInfos.dices.one++;break;
                case 2: gameInfos.dices.two++;break;
                case 3: gameInfos.dices.three++;break;
                case 4: gameInfos.dices.four++;break;
                case 5: gameInfos.dices.five++;break;
                case 6: gameInfos.dices.six++;break;
            }*/
            gameInfos.dices[dice-1]++;
            values.push(dice);
        }
    return values;
}

function getNbDice(value){
    switch(value){
        case 1: return gameInfos.dices.one;
        case 2: return gameInfos.dices.two;
        case 3: return gameInfos.dices.three;
        case 4: return gameInfos.dices.four;
        case 5: return gameInfos.dices.five;
        case 6: return gameInfos.dices.six;
    }
}

module.exports = main;
