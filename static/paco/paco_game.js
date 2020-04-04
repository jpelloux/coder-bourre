var socket = io();
var pseudo = sessionStorage.getItem('pseudo');

var maxCallDisplayed = 10;

socket.emit('reachGame', '');




$('#getDices').click(function(){
    socket.emit('getDices', '');
    $('#getDices').prop('disabled', true);
});

socket.on("dispPlayersNames", function(m){
    console.log(m);
    m.forEach(el => {
        $('#playersName').append(el + ', ');
    });
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
    dispPossibleCalls(player, call);

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

    var values = '';
    
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


function reply_click(clicked_id){
    socket.emit('callMade', [pseudo, clicked_id.toString().split("_")[2], clicked_id.toString().split("_")[1]]);
}