var socket = io('/game');

var pseudo = sessionStorage.getItem('pseudo');

var maxCallDisplayed = 10;



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
    document.getElementById('playersName').innerHTML= "Joueurs présents: " + str;
}

// Displays and starts the game when someone press the starter button
$('#start_button').click(function(){
    socket.emit("startGame_req", '');
});

socket.on("startGame_res", function(){
    document.getElementById('start_button').style.display = "contents";
    document.getElementById('content').style.display = "contents";
});








/**************************************************************************
 * THE FOLLOWING SOCKETS AND FONCTIONS MANAGE THE PHASE OF GETTING DICES  *
***************************************************************************/

$('#getDices_button').click(function(){
    socket.emit('getDices_req', '');
    $('#getDices_button').prop('disabled', true);
});

// Receives the values of dices from the server and displays the right images 
socket.on('getDices_res', function(m){
    m.forEach(el => {
        $('#dices').append('<img src=\"/static/images/dice_' + el + '.png\">' + '\t');
    });
});








/**************************************************************************************
 * THE FOLLOWING SOCKETS AND FONCTIONS MANAGE THE CALLING SYSTEM (HEART OF THE GAME)  *
***************************************************************************************/

socket.on('startGame_res', function(player){
    roundManager(player, '')
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
    dispEndersButtons(data.lastPlayer, data.nextPlayer, call);
    roundManager(data.nextPlayer, call);
});

function roundManager(player, call){
    document.getElementById('whosTurn').innerHTML = 'C\'EST AU TOUR DE '+ player.toUpperCase();
    dispPossibleCalls(player, call);
}

// Generates the html code that allows to make a call
// "call" is in the form "X_Y"
function dispPossibleCalls(player, call){
    if(player != pseudo){
        document.getElementById('numberBet').innerHTML = '';
        return;
    }
    var numberCalled = call=='' ? 0 : parseInt(call.split('_')[0]);
    var valueCalled = call=='' ? 0 : parseInt(call.split('_')[1]);
 
    var values = "";
    for (var i=1; i<=6; i++){
        values += '<p>'
        for (var j=1; j<=maxCallDisplayed; j++){
            if(call == '') 
            {// case of the first call of the round
                if(i!=1){ // we cannot start with a call on pacos
                    values += '<span onClick="valuePressed(this.id)" id=\"value_' + i.toString() + '_' +  j.toString() + '\">';
                }
                else{
                    values += '<span style="color:#C4C4C4" id=\"value_' + j.toString() + '_' +  i.toString() + '\">';
                }
            }
            else 
            {// cases of the next calls
                if(     (valueCalled!=1 && j==numberCalled && i>valueCalled) //allows the calls of type X+_Y
                        || (j>numberCalled && i==valueCalled) //allows the calls of type X_Y+
                        || (valueCalled!=1 && i==1 && j>=numberCalled/2) //allows the calls of pacos
                        || (valueCalled==1 && (i==1 && j>numberCalled || i!=1 && j>numberCalled*2)) //manages the case where the last call was on pacos
                        ){
                    values += '<span onClick="valuePressed(this.id)" id=\"value_' + i.toString() + '_' +  j.toString() + '\">';
                }
                else{
                    values += '<span style="color:#C4C4C4" id=\"value_' + j.toString() + '_' +  i.toString() + '\">';
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

function dispEndersButtons(lastPlayer, player, call){
    if(player != pseudo){
        document.getElementById('enders_buttons').innerHTML = '';
        return;
    }
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
    
    //display who ended the game and how
    var enderType = data.enderType=="menteurButton" ? "menteur !" : "tout pile !";
    $('#othersCalls').append('<p>' + data.endingPlayer + ' annonce ' + enderType + '</p>');
    
    //display the number total of each value
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
})