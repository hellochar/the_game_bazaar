WEB_SOCKET_DEBUG = true;

$(function() {
	var App;
	App = {};

    //---------------------------------------------
    //CANVAS FUNCTIONS
    //---------------------------------------------
      
    App.requestAnimationFrame = window.requestAnimationFrame || 
                                window.mozRequestAnimationFrame ||
                                window.webkitRequestAnimationFrame || 
                                window.msRequestAnimationFrame;

    App.randomColor = function() {
        return "#" + Math.random().toString(16).slice(2, 8);
    };

    App.clear = function() {
        App.ctx.clearRect(0, 0, App.canvas.width, App.canvas.height);
    };
    App.drawCircle = function(x, y, r, color) {
        App.ctx.beginPath();
        App.ctx.arc(x, y, r, 0, Math.PI * 2, true);
        App.ctx.fillStyle = color;
        App.ctx.fill();
    };

    App.onClick = function(e) {
        var posX = $(this).position().left,
            posY = $(this).position().top;
        var x = e.pageX - posX,
            y = e.pageY - posY;
        if (App.playerMovement) {
            App.playerMovement(x, y);
        }
    };

    App.refreshAll = function() {
        App.clear();
        if (App.connectionState == "connected") {
            // TODO: However you build your game state updater,
            // change the rendering logic here.
            for ( var player in Players) {
                if (Players.hasOwnProperty(player)) {
                    player = Players[player];
                    App.drawCircle(player.x, player.y, 20, player.color);
                }
            }
        } else if (App.connectionState == "connecting") {
            App.ctx.fillStyle = "Black";
            App.ctx.fillText("Connecting...", 400, 200);
        } else if (App.connectionState == "blank") {
            App.ctx.fillStyle = "Black";
            App.ctx.fillText("Nothing...", 400, 200);
        }
        App.requestAnimationFrame(App.refreshAll);
    };

    //---------------------------------------------
    //INITIALIZE CANVAS AND SOCKET.IO
    //---------------------------------------------

    console.log("Init canvas");
    App.canvas = document.getElementById('game-canvas');
    App.ctx = App.canvas.getContext("2d");
    App.ctx.globalAlpha = 0.4;
    App.ctx.textAlign = "center";
    App.ctx.font = "14px Helvetica";
    App.canvas.tabIndex = "0";
    App.connectionState = "blank";
    App.me = '#000000';

    $(App.canvas).click(App.onClick);

    App.socket = io.connect('/game');

    console.log("Attemting to connect");

    App.socket.on('connecting', function() {
        console.log("Connecting...");
        App.connectionState = "connecting";
    });

    //---------------------------------------------
    //MANAGING LOBBY STATE
    //---------------------------------------------
    
    //join the lobby as soon as we connect
    App.socket.on('connect', function () {
        // PUT IN HERE STUFF THAT SHOULD HAPPEN AFTER YOU ARE CONNECTED
        data = {
            'game_id': 'GAME_ID'
        };
        console.log("Connected!");
        App.connectionState = "connected";

        App.socket.emit('join', data);

        $(window).bind("beforeunload", function() {
            App.socket.emit('leave', 'GAME_ID');
            App.socket.disconnect();
        });

        $('#start-game').click(function() {
            console.log("start game");
            start_game();
        });
    });

    // Let client know someone has joined
    App.socket.on('join', function (data){
        console.log("Joined Game at: ", data.timestamp);
        // TODO: Add data.player_id to game state
    })

    // Starting a Game
    App.socket.on('start', function (data) {
        console.log("Timestamp: ", data.timestamp);
        $('#game-container').show();
        $('#lobby-container').hide();
    });

    //---------------------------------------------
    //MANAGING GAME STATE
    //---------------------------------------------

    App.playerMovement = function(x, y) {
        data = {
            'x': x,
            'y': y,
            'game_id': 'GAME_ID'
        };
        App.socket.emit('input', data);
    };

    App.socket.on('input', function (data) {
        // Update the game state.
        // TODO: FILL IN HERE
        timestamp = data['timestamp']
        player_id = data['player_id']
        player_input = data['player_input']
    });


    //---------------------------------------------
    //SOCKET.IO ERROR CATCHING
    //---------------------------------------------
    socket.on('reconnect', function () {
        message('System', 'Reconnected to the server');
    });

    socket.on('reconnecting', function () {
        message('System', 'Attempting to re-connect to the server');
    });

    socket.on('error', function (e) {
        message('System', e ? e : 'An unknown error occurred');
    });

    //---------------------------------------------
    // LOBBY FUNCTIONS
    //---------------------------------------------
    function start_game() {
        //TODO: Use a real game ID
        data = {
            'game_id': 'GAME_ID'
        };
        socket.emit('start', data); 
        //don't really need a message
    }

    // DOM manipulation
    $().ready(function() {
        $('#game-container').hide();
        $('#lobby-container').show();
    });

    App.requestAnimationFrame(App.refreshAll);
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
