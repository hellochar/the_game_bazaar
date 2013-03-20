WEB_SOCKET_DEBUG = true;

$(function() {
    // DOM manipulation
    $().ready(function() {
        $('#game-container').hide();
        $('#lobby-container').show();
    });
    var game = Game();
    game.init();
});

// Start off by creating a new instance of a Game
function Game() {

    // Constants
    var self = this;

    // Constants
    self.GAME_STATES = {
        INIT:           0,
        CONNECTING:     1,
        CONNECTED:      2,
        DISCONNECTED:   3,
    };

    self.init = function() {
        //---------------------------------------------
        //INITIALIZE SOCKET.IO
        //---------------------------------------------
        self.conn_state = self.GAME_STATES.INIT;

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
        self.socket.on('input', self.handleInput);


        // DEBUG
        console.log("Attemting to connect");
   
        //---------------------------------------------
        // INITIALIZE CANVAS
        //---------------------------------------------

        // DEBUG
        console.log("Init canvas");

        self.renderer = Renderer();

    };

    self.handleConnecting = function() {
        // DEBUG
        console.log("Connecting...");

        self.conn_state = self.GAME_STATES.CONNECTING;
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
        
        self.conn_state = self.GAME_STATES.CONNECTED;
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

        // TODO: Change this to something better
        $.ajax({
            type: "GET",
            url: "/game/userlist",
            data: {
                "game_id": self.game_id
            },
            headers: {
                "X-CSRFToken": $.cookie('csrftoken')
            },
            success: function (data){
                if(data['success'] === true){
                    self.updatePlayerList(data['players']);
                    self.populatePlayerNames();
                }
                else {
                    // DEBUG
                    console.log("Couldn't load the player list");
                }
                return false;
            }
        });
    };

    // Starting a Game
    self.handleGameStart = function (data) {
        // DEBUG
        console.log("Timestamp: ", data.timestamp);

        // Begin rendering and handling user input
        self.bindClick(self.playerMovement);
        self.renderer.startRendering(self);
        
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
            'player_id': self.player_id
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

                    self.gamestate = GameState(map_data_json);
                    
                    // DEBUG
                    window.gamestate = self.gamestate;

                    self.populatePlayerNames();
                    self.finishInitialization();
                }
                else {
                    $("#game-id").innerHTML = 'ERROR: Could not load that map id';
                }
                return false;
            }
        });
    };

    self.updatePlayerList = function(player_list) {
        // DEBUG
        console.log("Updating player names");

        var parent = $("#player-usernames");
        parent.empty();
        for (var index in player_list) {
            elem = $(document.createElement("li"));
            elem.html(player_list[index]);
            parent.append(elem);
        }
    };

    self.populatePlayerNames = function() {
        // DEBUG
        console.log("Populating player names");

        var usernames = $("#player-usernames");
        var username_list = Array(usernames.children().length);
        for (var index = 0; index < usernames.children().length; index++) {
            username_list[index] = usernames.children()[index].innerHTML;
        }
        self.gamestate.populatePlayerNames(username_list);
    };

    self.playerMovement = function(x, y) {
        data = {
            'x': x,
            'y': y,
            'game_id': self.game_id,
            'player_id': self.player_id
        };
        self.socket.emit('input', data);
    };

    self.handleInput = function (data) {
        // Get our variables.
        var timestamp = data['timestamp'];
        var player_id = data['player_id'];
        var x = data['x'];
        var y = data['y'];
        // Update our timestamps.
        var updateTime = timestamp - self.server_start_time;
        // Update the game state.
        // TODO modify the correct unit.
        self.gamestate.players[player_id].units[0].update(updateTime, {'x': x, 'y': y});
    };

    //---------------------------------------------
    //SOCKET.IO ERROR CATCHING
    //---------------------------------------------

    self.handleDisconnect = function () {
        self.conn_state = GAME_STATE.DISCONNECTED;
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

    return self;
}
