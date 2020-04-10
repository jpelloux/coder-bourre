var socket = io('/game');

var pseudo = sessionStorage.getItem('pseudo');
var nbDice = 3;
var myPalificoHappenned = false;
var palificoRound = false;




/********************************************************************************************
 * THE FOLLOWING SOCKETS AND FONCTIONS MANAGE THE CONNECTION OF PLAYERS AND START THE GAME  *
*********************************************************************************************/

// Displays players list when I reach the game room
socket.emit("gameReached", pseudo, function(players){
    dispPlayersNames(players);
});

// updates players list when a new player reach the game room
socket.on("updatePlayersList", function(players){
    dispPlayersNames(players)
});

function dispPlayersNames(namesTab){
    var str = "";
    namesTab.forEach(el => {
        str += el + ', '
    });
    str = str.substring(0, str.length - 2);
    document.getElementById('playersName').innerHTML= pseudo + "<br>Joueurs présents: " + str;
}

// Displays and starts the game when someone press the starter button
$('#start_button').click(function(){
    socket.emit('dispGame_req', '');
});

socket.on("dispGame_res", function(){
    document.getElementById('start_button').style.display = "contents";
    document.getElementById('content').style.display = "contents";
});








/**************************************************************************
 * THE FOLLOWING SOCKETS AND FONCTIONS MANAGE THE PHASE OF GETTING DICES  *
***************************************************************************/

// Asks and receives the values of dices from the server, and displays the right images 
$('#getDices_button').click(function(){
    socket.emit('getDices_req', nbDice, function(dices){
        var str = "";
        dices.forEach(val => {
            str += '<img src=\"/static/images/dice_' + val + '.png\">'
        });
        document.getElementById('dices').innerHTML = str;
    });
    $('#getDices_button').prop('disabled', true);
});







/**************************************************************************************
 * THE FOLLOWING SOCKETS AND FONCTIONS MANAGE THE CALLING SYSTEM (HEART OF THE GAME)  *
***************************************************************************************/

socket.on('startGame', function(player){
    document.getElementById('whosTurn').innerHTML = 'C\'EST AU TOUR DE '+ player.toUpperCase();
    document.getElementById('othersCalls').innerHTML = '';
    if(player!=pseudo){
        document.getElementById('numberBet').innerHTML = '';
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
    $('#othersCalls').append('<p>' + data.lastPlayer + ' annonce ' + data.numberCalled + ' ' + data.valueCalled + '</p>');
    var call = data.numberCalled + '_' + data.valueCalled;
    document.getElementById('whosTurn').innerHTML = 'C\'EST AU TOUR DE '+ data.nextPlayer.toUpperCase();

    if(data.nextPlayer!=pseudo){
        document.getElementById('numberBet').innerHTML = '';
        document.getElementById('enders_buttons').innerHTML = '';
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
        for (var j=1; j<=15; j++){
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
    document.getElementById('numberBet').innerHTML = values;
}


function valuePressed(id){
    socket.emit('callMade_req', {"pseudo":pseudo, "numberCalled":id.toString().split("_")[2], "valueCalled":id.toString().split("_")[1] });
}







/****************************************************************************************************
 * THE FOLLOWING SOCKETS AND FONCTIONS MANAGE THE PRESSURE ON AN ENDER BUTTON (MENTEUR & TOUTPILE)  *
*****************************************************************************************************/

function dispEndersButtons(lastPlayer, call){
    var values = '<p>';
    values += '<button id="menteurButton" onClick="enderButtonPressed(this.id, \'' + call + '\', \'' + lastPlayer + '\')">MENTEUR !</button>';
    values += '<p></p>';
    values += '<button id="toutpileButton" onClick="enderButtonPressed(this.id, \'' + call + '\', \'' + lastPlayer + '\')">TOUT PILE</button>';
    values += '</p>';
    document.getElementById('enders_buttons').innerHTML = values;
}

function enderButtonPressed(enderType, lastCall, lastPlayer){
    socket.emit('endRound_req', {
        "pseudo": pseudo,
        "lastPlayer": lastPlayer,
        "enderType": enderType, 
        "numberCalled":lastCall.toString().split("_")[0], 
        "valueCalled":lastCall.toString().split("_")[1]})
}

/** "data" is an object which contains :
 *      - "endingPlayer": the pseudo of the player who ended the game
 *      - "enderType": either "menteurButton" or "toutpileButton"
 *      - "hasWin": a boolean true if a dice is won, or truf if a dice is lost
 *      - "pseudo": the pseudo of the player who have lose or win a dice
 *      - "dices": an array containing the actual number of each dice (total of all hands)
*/
socket.on('endRound_res',function(data){
    palificoRound=false; // useful only if the previous round was in palifico
    
    if(pseudo == data.pseudo){
        updateNbDices(data.hasWin);
    }
    dispEndGame(data);
    $('#getDices_button').prop('disabled', false);
});


// description of "data" is with the socket listening to 'endRound_res'
function dispEndGame(data){
    document.getElementById('whosTurn').innerHTML = 'FIN DE LA MANCHE, RELANCEZ VOS DÉS !';

    //display who ended the game and how
    var enderType = data.enderType=="menteurButton" ? "menteur !" : "tout pile !";
    $('#othersCalls').append('<p>' + data.endingPlayer + ' annonce ' + enderType + '</p>');
    
    //display the total number of each dice value
    var str = ["paco(s)", "deux", "trois", "quatre", "cinq", "six"];
    var totalDicesStr = '<p style="text-align:left">Il y avait :<br>';
    totalDicesStr    += '<ul style="text-align:left">';
    for (var i=0; i<6; i++){
        totalDicesStr+= '<li>' + data.dices[i] + ' ' + str[i] + '</li>';
    }
    totalDicesStr    += '</ul></p>';
    $('#othersCalls').append(totalDicesStr);

    //display who will loose or win a dice
    var res = data.hasWin?"gagne":"perd";
    $('#othersCalls').append('<p>' + data.pseudo + ' ' + res + ' ' + "un dé !" + '</p>');
}

function updateNbDices(hasWin){
    if(hasWin && nbDice<5){
        nbDice++;
    }else if (!hasWin && nbDice>0){
        nbDice--;        
    }else{
        //nothing to do
    }
    
    if(nbDice==0){
        socket.emit('playerQuit_req', pseudo);
        document.getElementById('dices_area').innerHTML = 'T\'as perdu gros nul !';
    }else if(!myPalificoHappenned && nbDice==1){ //palifico (triggered only once per player)
        socket.emit('palifico_req', '');
        myPalificoHappenned = true;
    }
}

socket.on('palifico_res',function(){
    $('#othersCalls').append('<p>Palifico !</p>');
    palificoRound=true;
});

socket.on('playerQuit_res',function(deadPlayer){
    $('#othersCalls').append('<p>' + deadPlayer + ' est mort !' + '</p>');
});

//penser a désactiver les enderbuttons apres appui et a les reactiver en début de round