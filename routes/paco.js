var express = require('express');
var path = require('path');
var router = express.Router();
var io = null;

var gameInfos = {
    "players": [], // pseudos of the differents players
    "sockets": [], // ids of players sockets
    "nbReadyPlayers": 0, // increment each time someone get his dices, start game when =players.length
    "turn": 0, // used to tell to clients that it's the turn of players[turn]
    "dices": [0, 0, 0, 0, 0, 0] // total of each dice value during a round
};

function main(io){
    const nsp_home = io.of('/home');
    const nsp_game = io.of('/game');


    nsp_home.on('connection', function(socket) { 

        // prevent user to choose an unavaiable pseudo
        socket.on("playingRequest", function(pseudo, fn){
            fn(gameInfos.players.includes(pseudo));
        })
    })




    nsp_game.on('connection', function(socket) { 

        // stores informations when a new player reach the game, then broadcast the info
        socket.on('gameReached', function(player, fn){
            if(!gameInfos.players.includes(player)){ // manage users who press f5 during game (shitty way tot do that)
                gameInfos.players.push(player);
                gameInfos.sockets.push(socket.id);
            }
            nsp_game.emit('updatePlayersList', gameInfos.players);
            fn(gameInfos.players);
        });

        // When a player starts the game, generates a random first player and allows everybody to get dices
        socket.on('dispGame_req', function(){
            if(gameInfos.players.length<=2){ // toutpile is forbidden when there are only two players
                nsp_game.emit('forbidToutpile', '');
            }
            gameInfos.turn = Math.floor(Math.random() * gameInfos.players.length);
            nsp_game.emit('dispGame_res', '');
        });

        // At the beggining of each round, wait for every player to get his dices, then fired startGame event
        socket.on('getDices_req', function(nbDice, fn){
            fn(getDices(nbDice));
            gameInfos.nbReadyPlayers++;
            if (gameInfos.nbReadyPlayers == gameInfos.players.length){
                nsp_game.emit('startGame', gameInfos.players[gameInfos.turn]);
            }
        });


        /** When a call is made, relays the informations to the next player
         *  "call" is an object which contains : 
         *      - "pseudo" : the pseudo of the last player
         *      - "numberCalled" : the last number of value called
         *      - "valueCalled" : the last value called
        */
        socket.on('callMade_req', function(call){
            gameInfos.turn = (gameInfos.turn + 1) % gameInfos.players.length;
            nextPlayer(call);
        });

        /** When a player hit an ender button (menteur or toutpile), calculates who lose or win a dice and tells everybody
         *  "data" is an object which contains :
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
                    pseudo = gameInfos.dices[valueCalled-1]+gameInfos.dices[0]<numberCalled ? data.lastPlayer : data.pseudo; //if the sum of the actual number of values called and pacos is less than the call, the last player lose
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
            //initialize informations for next round
            gameInfos.nbReadyPlayers=0;
            gameInfos.turn=gameInfos.players.indexOf(pseudo);
            gameInfos.dices=[0, 0, 0, 0, 0, 0];
        });

        // When a player doesn't have dices, updates infos
        socket.on('playerLose_req', function(pseudo){
            nsp_game.emit('playerLose_res', pseudo);
            playerLeftManager(gameInfos.players.indexOf(pseudo));
            gameInfos.turn = (gameInfos.turn + 1) % gameInfos.players.length;
        });

        // Relays the information to everyone is the next round will be in palifico
        socket.on('palifico_req', function(){
            nsp_game.emit('palifico_res', '');
        });


        socket.on('disconnect', function(){
            nsp_game.emit("disconnectedPlayer", gameInfos.players[gameInfos.sockets.indexOf(socket.id)]);
            playerLeftManager(gameInfos.sockets.indexOf(socket.id));
        });

        // Deletes the player and his socket at "index" and manages if there is a palifico or a loser 
        function playerLeftManager(index){
            if(gameInfos.turn==gameInfos.players.length || gameInfos.turn==gameInfos.players.length-1){
                            gameInfos.turn--;
                        }
            gameInfos.players.splice(index, 1);
            var s = gameInfos.sockets.splice(index, 1);
            nsp_game.emit('updatePlayersList', gameInfos.players);
            if(gameInfos.players.length==1){
                nsp_game.emit('youWin', gameInfos.players[0]);
                initializeData();
            }else if(gameInfos.players.length<=2){
                nsp_game.emit('forbidToutpile', '');
            }
            console.log("coin", index, gameInfos.turn)
            if(index==gameInfos.turn){
               /* var indexIdLastSocket = Math.abs((index-1)%gameInfos.players.length);
                console.log(index, indexIdLastSocket)
                nsp_game.emit('getLastCall_req', gameInfos.sockets[indexIdLastSocket])*/
                //nextPlayer();
            }
            
        }

        socket.on('getLastCall_res', function(call){
            console.log(call)
        })

        // Pass the turn to the next player to make a call (used when a player is disconnected). Call is the same that in 'callMade_req'
        function nextPlayer(call){
            nsp_game.emit('callMade_res', {  
                "lastPlayer": call.pseudo,
                "nextPlayer": gameInfos.players[gameInfos.turn], 
                "numberCalled": call.numberCalled, 
                "valueCalled":call.valueCalled });
        }

        function initializeData(){
            gameInfos.players= [];
            gameInfos.sockets= [];
            gameInfos.nbReadyPlayers= 0;
            gameInfos.turn= 0;
            gameInfos.dices= [0, 0, 0, 0, 0, 0];
        }

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
