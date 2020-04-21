var socket = io('/game');

var pseudo = sessionStorage.getItem('pseudo');
var nbDice = 5;
var myPalificoHappenned = false;
var palificoRound = false;
var useToutpile = true;
var savedCall = {'numberCalled': 0, 'valueCalled': 0} // used if a player is disconnected




/********************************************************************************************
 * THE FOLLOWING SOCKETS AND FONCTIONS MANAGE THE CONNECTION OF PLAYERS AND START THE GAME  *
*********************************************************************************************/

// Displays players list when I reach the game room
socket.emit("gameReached", pseudo, function(players){
    dispPlayersNames(players);
});

// updates players list when a new player reach the game room
socket.on("updatePlayersList", function(players){
    dispPlayersNames(players);
});
function dispPlayersNames(namesTab){
    var str = "";
    namesTab.forEach(el => {
        str += '<img id="player_pict" src="/static/img/utils/player.jpg"></img>' + el;
    });
    document.getElementById('players_content').innerHTML= str;
}

// Allows to throw dices when someone press the starter button
$('#start_button').click(function(){
    socket.emit('dispGame_req', '');
});
socket.on("dispGame_res", function(){
    dispStatus('La partie commence, lancez vos dés !')
    dispDices('<input type="button" id="getDices_button" onClick="getDices_buttonClicked()" value="Lancer les dés" />');
});


function getDices_buttonClicked(){
    socket.emit('getDices_req', nbDice, function(dices){
        var str = "";
        dices.forEach(val => {
            str += '<img src=\"/static/images/dice_' + val + '.png\">'
        });
        dispDices(str);
    });
}





/**************************************************************************
 * THE FOLLOWING SOCKETS AND FONCTIONS MANAGE THE PHASE OF GETTING DICES  *
***************************************************************************/

// Asks and receives the values of dices from the server, and displays the dices
$('#getDices_button').click(function(){
    getDices_buttonClicked();
});








/*****************************************************************
 * THE FOLLOWING SOCKETS AND FONCTIONS MANAGE THE CALLING SYSTEM *
******************************************************************/

// listen to the event fired by the server when everybody asked for his dices
socket.on('startGame', function(player){
    dispStatus('C\'EST AU TOUR DE '+ player.toUpperCase());
    document.getElementById('infos_content').innerHTML = '';
    if(player!=pseudo){
        document.getElementById('call_content').innerHTML = '';
    }
    else{
        dispPossibleCalls('');
    }
});

/**
 * Gets the information from the server that a call was made
 * "data" is an object which contains :
 *      - "lastPlayer" : the pseudo of the last player
 *      - "nextPlayer" : the pseudo of the next player
 *      - "numberCalled" : the last number of value called
 *      - "valueCalled" : the last value called
 */
socket.on('callMade_res', function(data){
    savedCall.numberCalled = data.numberCalled;
    savedCall.valueCalled = data.valueCalled;
    dispInfo(data.lastPlayer + ' annonce ' + data.numberCalled + ' ' + data.valueCalled)
    var call = data.numberCalled + '_' + data.valueCalled;
    dispStatus('C\'EST AU TOUR DE '+ data.nextPlayer.toUpperCase());
    if(data.nextPlayer!=pseudo){
        document.getElementById('call_content').innerHTML = '';
        document.getElementById('enders_buttons').innerHTML = '';
        $('#menteurButton').prop('disabled', false);
        $('#toutpileButton').prop('disabled', false);
    }
    else{
        dispPossibleCalls(call);
        dispEndersButtons(data.lastPlayer, call);
    }
});

// Generates the html code that allows to make a call
// "call" is in the form "X_Y"
function dispPossibleCalls(call){
    var numberCalled = call=='' ? 0 : parseInt(call.split('_')[0]);
    var valueCalled = call=='' ? 0 : parseInt(call.split('_')[1]);
    var values = "";
    for (var i=1; i<=6; i++){
        values += '<p>'
        for (var j=1; j<=20; j++){
            if(palificoRound){
                if(call == '') {// case of the first call of the round
                    values += '<span onClick="valuePressed(this.id)" id=\"value_' + i.toString() + '_' +  j.toString() + '\">';
                }else{// cases of the next calls
                    if (j>numberCalled && i==valueCalled){ //allows the calls of type X_Y+
                    
                        values += '<span onClick="valuePressed(this.id)" id=\"value_' + i.toString() + '_' +  j.toString() + '\">';
                    }else{
                        values += '<span style="color:#C4C4C4" id=\"value_' + j.toString() + '_' +  i.toString() + '\">';
                    }
                }
            }else{
                if(call == '') {// case of the first call of the round
                    if(i!=1){ // we cannot start with a call on pacos
                        values += '<span onClick="valuePressed(this.id)" id=\"value_' + i.toString() + '_' +  j.toString() + '\">';
                    }else{
                        values += '<span style="color:#C4C4C4" id=\"value_' + j.toString() + '_' +  i.toString() + '\">';
                    }
                }else{// cases of the next calls
                    if(     (valueCalled!=1 && j==numberCalled && i>valueCalled) //allows the calls of type X_Y+
                            || (j>numberCalled && i==valueCalled) //allows the calls of type X+_Y
                            || (valueCalled!=1 && i==1 && j>=numberCalled/2) //allows the calls of pacos
                            || (valueCalled==1 && (i==1 && j>numberCalled || i!=1 && j>numberCalled*2)) //manages the case where the last call was on pacos
                            ){
                        values += '<span onClick="valuePressed(this.id)" id=\"value_' + i.toString() + '_' +  j.toString() + '\">';
                    }else{
                        values += '<span style="color:#C4C4C4" id=\"value_' + j.toString() + '_' +  i.toString() + '\">';
                    }
                }
            }
            values += j.toString() + '\t';
            values += '</span>'
        }
        values += '<img src=\"/static/images/dice_' + i + '.png\">'
        values += '</p>\n'
    }
    document.getElementById('call_content').innerHTML = values;
}

// fonction called when a call is made
function valuePressed(id){
    socket.emit('callMade_req', {"pseudo":pseudo, "numberCalled":id.toString().split("_")[2], "valueCalled":id.toString().split("_")[1] });
}








/****************************************************************************************************
 * THE FOLLOWING SOCKETS AND FONCTIONS MANAGE THE PRESSURE ON AN ENDER BUTTON (MENTEUR & TOUTPILE)  *
*****************************************************************************************************/

// This event is fired when there are two players or less
socket.on('forbidToutpile', function(){
    useToutpile = false;
})

// Generates the html code that allows to end the game by calling "menteur" or "toutpile"
function dispEndersButtons(lastPlayer, call){
    var str = '<p>';
    str += '<button id="menteurButton" onClick="enderButtonPressed(this.id, \'' + call + '\', \'' + lastPlayer + '\')">MENTEUR !</button>';
    if(useToutpile){
        str += '<p></p>';
        str += '<button id="toutpileButton" onClick="enderButtonPressed(this.id, \'' + call + '\', \'' + lastPlayer + '\')">TOUT PILE</button>';
    }
    str += '</p>';
    document.getElementById('enders_buttons').innerHTML = str;
}

function enderButtonPressed(enderType, lastCall, lastPlayer){
    $('#menteurButton').prop('disabled', true);
    $('#toutpileButton').prop('disabled', true);
    socket.emit('endRound_req', {
        "pseudo": pseudo,
        "lastPlayer": lastPlayer,
        "enderType": enderType, 
        "numberCalled":lastCall.toString().split("_")[0], 
        "valueCalled":lastCall.toString().split("_")[1]})
}








/**********************************************************************************
 * THE FOLLOWING SOCKETS AND FONCTIONS MANAGE THE END OF A ROUND AND OF THE GAME  *
***********************************************************************************/


/** Listens to the answer from the server which contains the result of the round
 * "data" is an object which contains :
 *      - "endingPlayer": the pseudo of the player who ended the game
 *      - "enderType": either "menteurButton" or "toutpileButton"
 *      - "hasWin": a boolean true if a dice is won, or truf if a dice is lost
 *      - "pseudo": the pseudo of the player who have lost or won a dice
 *      - "dices": an array containing the actual number of each dice (total of all hands)
*/
socket.on('endRound_res',function(data){
    palificoRound=false; // useful only if the previous round was in palifico
    dispEndGame(data);
    if(pseudo == data.pseudo){
        updateNbDices(data.hasWin);
    }
    dispDices('<input type="button" id="getDices_button" onClick="getDices_buttonClicked()" value="Lancer les dés" />');
});


// Displays the differents infos after the end of the round ("data" is the same that in 'endRound_res')
function dispEndGame(data){
    dispStatus('FIN DE LA MANCHE, RELANCEZ VOS DÉS !');
    //display who ended the game and how
    var enderType = data.enderType=="menteurButton" ? "menteur !" : "tout pile !";
    dispInfo(data.endingPlayer + ' annonce ' + enderType);
    //display the total number of each dice value
    var str = ["paco(s)", "deux", "trois", "quatre", "cinq", "six"];
    var totalDicesStr = '<p style="text-align:left">Il y avait :<br>';
    totalDicesStr    += '<ul style="text-align:left">';
    for (var i=0; i<6; i++){
        totalDicesStr+= '<li>' + data.dices[i] + ' ' + str[i] + '</li>';
    }
    totalDicesStr    += '</ul></p>';
    dispInfo(totalDicesStr);
    //display who will lose or win a dice
    var res = data.hasWin?"gagne":"perd";
    dispInfo(data.pseudo + ' ' + res + ' ' + "un dé !");
}

// Updates the number of dices after the end of a round, end fired the palifico end playerLose events
function updateNbDices(hasWin){
    if(hasWin && nbDice<5){
        nbDice++;
    }else if (!hasWin && nbDice>0){
        nbDice--;        
    }else{}//nothing to do

    if(nbDice==0){
        socket.emit('playerLose_req', pseudo);
        var strloser ='';
        strloser += '<p>T\'as perdu gros nul !</p>'
        strloser += '<p><input type="button" onClick="redirectToHomePage()" value="Retourner au menu" /></p>'
        dispStatus(strloser);
    }else if(!myPalificoHappenned && nbDice==1){ //palifico (triggered only once per player)
        socket.emit('palifico_req', '');
        myPalificoHappenned = true;
    }
}

// Provides a palifico round when necessary
socket.on('palifico_res',function(){
    dispInfo('Palifico !');
    palificoRound=true;
});

// Displays when a player have lost
socket.on('playerLose_res',function(deadPlayer){
    dispInfo(deadPlayer + ' est mort !');
});

// Displays when a player have won
socket.on('youWin', function(player){
    dispInfo('Et c\'est une victoire pour ' + player);
    if(player==pseudo){
        var strWinner ='';
        strWinner += '<p>Victoire, wouhou sec pour tout le monde !</p>'
        strWinner += '<p><input type="button" onClick="redirectToHomePage()" value="Retourner au menu" /></p>'
        dispStatus(strWinner);
    }
});


// Displays when a player disconnected
socket.on('disconnectedPlayer', function(player){
    if(player != null){
        dispInfo(player + ' s\'est déconnecté');
    }else{
        dispInfo('Un problème est survenu');
    }
    dispInfo('Round annulé, relancez vos dés');
    dispStatus('FIN DE LA MANCHE, RELANCEZ VOS DÉS !');
    dispDices('<input type="button" id="getDices_button" onClick="getDices_buttonClicked()" value="Lancer les dés" />');
});

function redirectToHomePage()
{
   window.location.href = "/";
}


function dispInfo(info){
    $('#infos_content').append('<p>' + info + '</p>');
}

function dispStatus(status){
    document.getElementById('gameStatus_content').innerHTML = status;
}

function dispDices(str){
    document.getElementById('dices_content').innerHTML = str;
}

function test(){
    socket.emit("test", function(res){
        console.log(res);
    })
}