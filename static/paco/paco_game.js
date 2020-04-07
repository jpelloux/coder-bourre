var socket = io('/game');

var pseudo = sessionStorage.getItem('pseudo');

var maxCallDisplayed = 10;



// disp players list when I reach the game room
socket.emit("gameReached", pseudo, function(players){
    dispPlayersNames(players);
});

// update players list when a new player reach the game room
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

$('#start_button').click(function(){
    socket.emit("startGame_req", '');
});

socket.on("startGame_res", function(){
    document.getElementById('start_button').style.display = "contents";
    document.getElementById('content').style.display = "contents";
});




$('#getDices_button').click(function(){
    socket.emit('getDices', '');
    $('#getDices_button').prop('disabled', true);
});

socket.on('getDices', function(m){
    m.forEach(el => {
        $('#dices').append('<img src=\"/static/images/dice_' + el + '.png\">' + '\t');
    });
});

socket.on('startGame', function(player){
    roundManager(player, '')
});

socket.on('callMade', function(m){
    $('#othersCalls').append('<p>' + m.toDisp + '</p>');
    roundManager(m.player, m.call)
});





function roundManager(player, call){
    document.getElementById('whosTurn').innerHTML = 'C\'EST AU TOUR DE '+ player.toUpperCase();
    dispButtons(player);
    dispPossibleCalls(player, call);

}

function dispButtons(player){
    if(player != pseudo){
        document.getElementById('buttons').innerHTML = '';
        return;
    }
    var values = '<p>';
    values += '<button id="menteurButton" onClick="callButtonPressed(this.id)">MENTEUR !</button>';
    values += '<p></p>';
    values += '<button id="toutpileButton" onClick="callButtonPressed(this.id)">TOUT PILE</button>';
    values += '</p>';

    document.getElementById('buttons').innerHTML = values;
}

/* 
 * Génère le code html qui permet de faire une annonce
 *
 * call est sous la forme X_Y
**/
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
            {// cas de la première annonce de la manche
                if(i!=1){
                    values += '<span onClick="reply_click(this.id)" id=\"value_' + i.toString() + '_' +  j.toString() + '\">';
                }
                else{
                    values += '<span style="color:#C4C4C4" id=\"value_' + j.toString() + '_' +  i.toString() + '\">';
                }
            }
            else 
            {//annonces suivantes
                if(     (valueCalled!=1 && j==numberCalled && i>valueCalled) //permet les annonces de type X+_Y
                        || (j>numberCalled && i==valueCalled) //permet les annonces de type X_Y+
                        || (valueCalled!=1 && i==1 && j>=numberCalled/2) //permet des annonces en passage au paco
                        || (valueCalled==1 && (i==1 && j>numberCalled || i!=1 && j>numberCalled*2)) //gère les cas où la dernière annonce était un paco
                        ){
                    values += '<span onClick="reply_click(this.id)" id=\"value_' + i.toString() + '_' +  j.toString() + '\">';
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


function reply_click(id){
    socket.emit('callMade', [pseudo, id.toString().split("_")[2], id.toString().split("_")[1]]);
}

function callButtonPressed(id){
}