WEB_SOCKET_DEBUG = true;

// socket.io specific code
var socket = io.connect('/game');

$(window).bind("beforeunload", function() {
    socket.disconnect();
});

socket.on('connect', function () {
});

socket.on('user_input', function (timestamp, player_id, player_input) {
    // Update the game state.
});

socket.on('reconnect', function () {
    message('System', 'Reconnected to the server');
});

socket.on('reconnecting', function () {
    message('System', 'Attempting to re-connect to the server');
});

socket.on('error', function (e) {
    message('System', e ? e : 'An unknown error occurred');
});

// DOM manipulation
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