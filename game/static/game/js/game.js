WEB_SOCKET_DEBUG = true;

$(function() {
    // DOM manipulation
    $().ready(function() {
        $('#game-container').hide();
        $('#lobby-container').show();
    });
    var game = new Game();
    game.init();
    window.game = game;
});

// Constants
var GAME_STATES = {
    INIT:           0,
    CONNECTING:     1,
    CONNECTED:      2,
    DISCONNECTED:   3
};

// Start off by creating a new instance of a Game
function Game() {

    // Constants
    var self = this;

    self.init = function() {
        //---------------------------------------------
        //INITIALIZE SOCKET.IO
        //---------------------------------------------
        self.conn_state = GAME_STATES.INIT;

        self.socket = io.connect('/game', {
            reconnect: false
        });

        // BIND HANDLERS FOR SOCKET EVENTS

        // Connection handling
        self.socket.on('connecting', self.handleConnecting);
        self.socket.on('connect', self.handleConnected);
        // Error handling
        self.socket.on('disconnect', self.handleDisconnect);
        self.socket.on('error', self.handleConnectError);

        // Game logic handling
        self.socket.on('join', self.handleUserJoin);
        self.socket.on('start', self.handleGameStart);
        self.socket.on('click', self.handleClickMessage);
        self.socket.on('drag', self.handleDragMessage);


        // DEBUG
        console.log("Attemting to connect");

        //---------------------------------------------
        // INITIALIZE CANVAS
        //---------------------------------------------

        // DEBUG
        console.log("Init canvas");

        self.ui_renderer = new UIRenderer();
        //self.gs_renderer = new GSRenderer();
    };

    self.handleConnecting = function() {
        // DEBUG
        console.log("Connecting...");

        self.conn_state = GAME_STATES.CONNECTING;
    };

    //---------------------------------------------
    //MANAGING LOBBY STATE
    //---------------------------------------------

    //join the lobby as soon as we connect
    self.handleConnected = function () {
        // These divs are set in the context
        self.player_id = parseInt($("#player-id").attr("val"), 10);
        self.game_id = parseInt($("#game-id").attr("val"), 10);
        self.map_id = parseInt($("#map-id").attr("val"), 10);

        // Do some connecting and make sure we cleanup correctly.

        // DEBUG
        console.log("Connected!");

        self.conn_state = GAME_STATES.CONNECTED;
        $(window).bind("beforeunload", function() {
            data = {
                'game_id': self.game_id
            },
            self.socket.emit('leave', data);
            self.socket.disconnect();
        });

        // Set up the gamestate with an ajax call.
        // This method calls finishInitialization() once the ajax call succeeds.
        self.instantiateGameState();
    };

    // Let client know someone has joined
    self.handleUserJoin = function (data) {
        // DEBUG
        console.log("Someone joined the game at: ", data.timestamp);
        console.log("Player id: ", data.player_id);
        console.log("Joining user's name: ", data.username);

        self.addPlayerToHTML(data.player_id, data.username);
    };

    // Starting a Game
    self.handleGameStart = function (data) {
        // DEBUG
        console.log("Timestamp: ", data.timestamp);

        // Begin rendering and handling user input
        self.ui_renderer.bindClick(self.handleClick);
        self.ui_renderer.bindDrag(self.handleDrag);
        self.ui_renderer.startRendering(self.render);

        $('#lobby-container').hide();
        $('#game-container').show();
        self.server_start_time = data.timestamp;
        self.client_start_time = Date.now();
    };

    //---------------------------------------------
    //MANAGING GAME STATE
    //---------------------------------------------

    self.finishInitialization = function() {
        // Broadcast a join
        // If the user is the game owner, no one else should be in the game
        data = {
            'game_id': self.game_id,
            'player_id': self.player_id,
            'username': self.getUsernameByPid(self.player_id)
        };
        self.socket.emit('join', data);

        $('#start-game').click(function() {
            // DEBUG
            console.log("start game");

            self.start_game();
        });
    };

    self.instantiateGameState = function() {
        self.gamestate = false;
        $.ajax({
            type: "GET",
            url: "/map",
            data: {
                "map_id": parseInt(self.map_id, 10)
            },
            headers: {
                "X-CSRFToken": $.cookie('csrftoken')
            },
            success: function (data){
                if(data['success'] === true){
                    map_data_json = JSON.parse(data.map_data);
                    // DEBUG
                    console.log("putting the following into window.map_data: " + map_data_json);
                    // DEBUG
                    window.map_data = map_data_json;

                    self.gamestate = GameState.fromJSON(map_data_json);

                    // DEBUG
                    window.gamestate = self.gamestate;

                    self.populatePlayerNamesInGSFromHTML();
                    self.finishInitialization();
                }
                else {
                    $("#game-id").text('ERROR: Could not load that map id');
                }
                return false;
            }
        });
    };

    self.addPlayerToHTML = function(new_player_id, new_player_username) {
        // DEBUG
        console.log("Updating player names");

        var slot = $("#player-slot-" + new_player_id.toString(10));
        slot.text(new_player_username);
        self.gamestate.players[new_player_id].username = new_player_username;
    };

    self.getUsernameByPid = function(player_id) {
        return $("#player-slot-" + player_id.toString(10)).text();
    };

    self.populatePlayerNamesInGSFromHTML = function() {
        // DEBUG
        console.log("Populating player names");

        var usernames = $("#player-usernames");
        var username_list = Array(usernames.children().length);
        for (var index = 0; index < usernames.children().length; index++) {
            self.gamestate.players[index].username = $(usernames.children()[index]).text();
        }
    };

    self.handleClick = function(clicktype, clickpos) {
        data = {
            'clickpos': clickpos,
            'game_id': self.game_id,
            'player_id': self.player_id,
            'clicktype': clicktype
        };
        self.socket.emit('click', data);
    };

    self.handleDrag = function(clicktype, dragstart, dragend) {
        data = {
            'dragstart': dragstart,
            'dragend': dragend,
            'game_id': self.game_id,
            'player_id': self.player_id,
            'clicktype': clicktype
        };
        self.socket.emit('drag', data);
    };

    self.handleClickMessage = function (data) {
        // Get our variables.
        var timestamp = data['timestamp'];
        var player_id = data['player_id'];
        var clickpos = data['clickpos'];
        var clicktype = data['clicktype'];
        // Find the time at which this message was supposed to be applied.
        var updateTime = timestamp - self.server_start_time;
        // Update the game state.
        // On right click
        if (clicktype === 3) {
            self.moveUnits(updateTime, player_id, clickpos);
        }
        // On left click
        if (clicktype === 1) {
            GS_UI.selectUnit(self.gamestate.players[player_id], updateTime, clickpos);
        }
    };

    // Move all units in the player_id's unit list that are currently selected to
    // the clickpos and execute the update at in-game time updateTime.
    self.moveUnits = function(updateTime, player_id, clickpos) {
        var unit_list = self.gamestate.players[player_id].selectedUnits;
        unit_list.forEach(function(unit) {
            unit.update(updateTime, clickpos);
        });
    };

    self.handleDragMessage = function(data) {
        // Get our variables.
        var timestamp = data['timestamp'];
        var player_id = data['player_id'];
        var dragstart = data['dragstart'];
        var dragend = data['dragend'];
        var clicktype = data['clicktype'];

        // Find the time at which this message was supposed to be applied.
        var updateTime = timestamp - self.server_start_time;

        // On left mouse drag
        if (clicktype === 1) {
            GS_UI.selectUnits(self.gamestate.players[player_id], updateTime, dragstart, dragend);
        }
        // On right mouse drag
        if (clicktype === 3) {
            self.moveUnits(updateTime, player_id, dragend);
        }
    };

    //---------------------------------------------
    //SOCKET.IO ERROR CATCHING
    //---------------------------------------------

    self.handleDisconnect = function () {
        self.conn_state = GAME_STATES.DISCONNECTED;
    };

    self.handleConnectError = function (e) {
        // message('System', e ? e : 'An unknown error occurred');
    };

    //---------------------------------------------
    // LOBBY FUNCTIONS
    //---------------------------------------------
    self.start_game = function() {
        data = {
            'game_id': self.game_id
        };
        self.socket.emit('start', data);
    };

    //---------------------------------------------
    // RENDERING FUNCTIONS
    //---------------------------------------------
    self.render = function() {
        var now_time = Date.now();
        var start_time = self.client_start_time;
        var snapshot = self.gamestate.evaluate(now_time - start_time);
        var renderText = function(text) {
            self.ui_renderer.renderText(text, 400, 200, "red");
        };
        switch (self.conn_state) {
            case GAME_STATES.CONNECTED:
                self.ui_renderer.renderGS(snapshot, self.player_id)
                break;
            case GAME_STATES.INIT:
                renderText("Initializing...");
                break;
            case GAME_STATES.CONNECTING:
                renderText("Connecting...");
                break;
            case GAME_STATES.DISCONNECTED:
                renderText("Disconnected!");
                break;
            default:
                renderText("Problem!");
                break;
        }
    };

    return self;
}
