WEB_SOCKET_DEBUG = true;

// socket.io specific code
var socket = io.connect('/game');

$(window).bind("beforeunload", function() {
    socket.emit('leave lobby', 'GAME_ID');
    socket.disconnect();
});

//---------------------------------------------
//MANAGING LOBBY STATE
//---------------------------------------------
//join the lobby as soon as we connect
socket.on('connect', function () {
    socket.emit('join lobby', 'GAME_ID');
});

//let client know someone has joined
socket.on('join_message', function (timestamp){
    console.log("Joined Game at: ", timestamp);
})

// Starting a Game
socket.on('game_start', function (timestamp) {
    console.log("Timestamp: ", timestamp);
    $('#game-container').show();
    $('#lobby-container').hide();
});

//---------------------------------------------
//MANAGING GAME STATE
//---------------------------------------------
socket.on('user_input', function (timestamp, player_id, player_input) {
    // Update the game state.
});

//---------------------------------------------
// LOBBY FUNCTIONS
//---------------------------------------------
function start_game(){
    socket.emit('start game', 'GAME_ID'); 
    //don't really need a message
}

// DOM manipulation
$().ready(function(){
    $('#game-container').hide();
    $('#lobby-container').show();


    $('#start-game').click(function(){
        console.log("start game");
        start_game();
    });
});

$(function () {
    // $('#set-nickname').submit(function (ev) {
    //     socket.emit('nickname', $('#nick').val(), function (set) {
    //         if (!set) {
    //             clear();
    //             return $('#chat').addClass('nickname-set');
    //         }
    //         $('#nickname-err').css('visibility', 'visible');
    //     });
    //     return false;
    // });

    // $('#send-message').submit(function () {
    //     message('me', $('#message').val());
    //     socket.emit('user message', $('#message').val());
    //     clear();
    //     $('#lines').get(0).scrollTop = 10000000;
    //     return false;
    // });

    // function clear () {
    //     $('#message').val('').focus();
    // };
});