WEB_SOCKET_DEBUG = true;

$(function() {
	var App;
	App = {};

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
    //CANVAS FUNCTIONS
    //---------------------------------------------

    var requestAnimationFrame = window.requestAnimationFrame ||
                            window.mozRequestAnimationFrame ||
                            window.webkitRequestAnimationFrame ||
                            window.msRequestAnimationFrame;

    window.requestAnimationFrame = requestAnimationFrame;

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
        $(window).bind("beforeunload", function() {
            App.socket.emit('leave', game_id);
            App.socket.disconnect();
            return false;
        });


        App.clear();
        if (App.connectionState == "connected") {
            // TODO: However you build your game state updater,
            // change the rendering logic here.

            // for (var player in Players) {
            //     if (Players.hasOwnProperty(player)) {
            //         player = Players[player];
            //         App.drawCircle(player.x, player.y, 20, player.color);
            //     }
            // }
        } else if (App.connectionState == "connecting") {
            App.ctx.fillStyle = "Black";
            App.ctx.fillText("Connecting...", 400, 200);
        } else if (App.connectionState == "blank") {
            App.ctx.fillStyle = "Black";
            App.ctx.fillText("Nothing...", 400, 200);
        }
        requestAnimationFrame(App.refreshAll);
    };

    //---------------------------------------------
    //MANAGING LOBBY STATE
    //---------------------------------------------

    //join the lobby as soon as we connect
    App.socket.on('connect', function () {
        // These divs are set in the context
        App.player_id = parseInt($("#player-id").attr("val"), 10);
        App.game_id = parseInt($("#game-id").attr("val"), 10);
        App.map_id = parseInt($("#map-id").attr("val"), 10);

        // Do some connecting and make sure we cleanup correctly.
        console.log("Connected!");
        App.connectionState = "connected";
        $(window).bind("beforeunload", function() {
            data = {
                'game_id': App.game_id
            },
            App.socket.emit('leave', data);
            App.socket.disconnect();
        });

        // Set up the gamestate with an ajax call.
        // This method calls finishInitialization() once the ajax call succeeds.
        App.instantiateGameState();
    });

    // Let client know someone has joined
    App.socket.on('join', function (data){
        console.log("Someone joined the game at: ", data.timestamp);
        // TODO: Add data.player_id to game state
        $.ajax({
            type: "GET",
            url: "/game/userlist",
            data: {
                "game_id": App.game_id
            },
            headers: {
                "X-CSRFToken": $.cookie('csrftoken')
            },
            success: function (data){
                if(data['success'] === true){
                    App.updatePlayerList(data['players']);
                    App.populatePlayerNames();
                }
                else {
                    console.log("Couldn't load the player list");
                }
                return false;
            }
        });
    });

    // Starting a Game
    App.socket.on('start', function (data) {
        console.log("Timestamp: ", data.timestamp);
        $('#lobby-container').hide();
        $('#game-container').show();
    });

    //---------------------------------------------
    //MANAGING GAME STATE
    //---------------------------------------------

    App.finishInitialization = function() {
        // If this player is not the game owner, then broadcast a join.
        data = {
            'game_id': App.game_id
        };
        App.socket.emit('join', data);

        $('#start-game').click(function() {
            console.log("start game");
            App.start_game();
        });
    };

    App.instantiateGameState = function() {
        App.gamestate = false;
        $.ajax({
            type: "GET",
            url: "/map",
            data: {
                "map_id": parseInt(App.map_id, 10)
            },
            headers: {
                "X-CSRFToken": $.cookie('csrftoken')
            },
            success: function (data){
                if(data['success'] === true){
                    console.log("putting the following into window.map_data: " + data.map_data);
                    window.map_data = data.map_data;
                    App.gamestate = GameState(data.map_data);
                    window.gamestate = App.gamestate;
                    App.populatePlayerNames();
                    App.finishInitialization();
                }
                else {
                    $("#game-id").innerHTML = 'ERROR: Could not load that map id';
                }
                return false;
            }
        });
    };

    App.updatePlayerList = function(player_list) {
        console.log("Updating player names");
        var parent = $("#player-usernames");
        parent.empty();
        for (var index in player_list) {
            elem = $(document.createElement("li"));
            elem.html(player_list[index]);
            parent.append(elem);
        }
    };

    App.populatePlayerNames = function() {
        console.log("Populating player names");
        var usernames = $("#player-usernames");
        var username_list = Array(usernames.children().length);
        for (var index = 0; index < usernames.children().length; index++) {
            username_list[index] = usernames.children()[index].innerHTML;
        }
        App.gamestate.populatePlayerNames(username_list);
    };

    App.playerMovement = function(x, y) {
        data = {
            'x': x,
            'y': y,
            'game_id': $("#game-id").attr("val")
        };
        App.socket.emit('input', data);
    };

    App.socket.on('input', function (data) {
        // Update the game state.
        // TODO: FILL IN HERE
        timestamp = data['timestamp'];
        player_id = data['player_id'];
        player_input = data['player_input'];
    });

    //---------------------------------------------
    //SOCKET.IO ERROR CATCHING
    //---------------------------------------------
    App.socket.on('reconnect', function () {
        // message('System', 'Reconnected to the server');
    });

    App.socket.on('reconnecting', function () {
        // message('System', 'Attempting to re-connect to the server');
    });

    App.socket.on('error', function (e) {
        // message('System', e ? e : 'An unknown error occurred');
    });

    //---------------------------------------------
    // LOBBY FUNCTIONS
    //---------------------------------------------
    App.start_game = function() {
        //TODO: Use a real game ID
        data = {
            'game_id': $("#game-id").attr("val")
        };
        App.socket.emit('start', data);
        //don't really need a message
    };

    // DOM manipulation
    $().ready(function() {
        $('#game-container').hide();
        $('#lobby-container').show();
    });

    requestAnimationFrame(App.refreshAll);
});
