WEB_SOCKET_DEBUG = true;

function Game() {
}

// Constants
Game.GAME_STATES = {
    INIT:           0,
    CONNECTING:     1,
    CONNECTED:      2,
    DISCONNECTED:   3
};

Game.prototype.init = function() {
    var self = this;
    //---------------------------------------------
    //INITIALIZE SOCKET.IO
    //---------------------------------------------
    self.conn_state = Game.GAME_STATES.INIT;

    self.socket = io.connect('/game', {
        reconnect: false
    });

    // BIND HANDLERS FOR SOCKET EVENTS

    // Connection handling
    self.socket.on('connecting', self.handleConnecting.bind(this));
    self.socket.on('connect', self.handleConnected.bind(this));
    // Error handling
    self.socket.on('disconnect', self.handleDisconnect.bind(this));
    self.socket.on('error', self.handleConnectError.bind(this));

    // Game logic handling
    self.socket.on('join', self.handleUserJoin.bind(this));
    self.socket.on('start', self.handleGameStart.bind(this));
    self.socket.on('click', self.handleClickMessage.bind(this));
    self.socket.on('drag', self.handleDragMessage.bind(this));

    // DEBUG
    console.log("Attemting to connect");

    // DEBUG
    console.log("Init canvas");

    self.renderer = new Renderer();

};

Game.prototype.handleConnecting = function() {
    var self = this;
    // DEBUG
    console.log("Connecting...");

    self.conn_state = Game.GAME_STATES.CONNECTING;
};

//---------------------------------------------
//MANAGING LOBBY STATE
//---------------------------------------------

//join the lobby as soon as we connect
Game.prototype.handleConnected = function () {
    var self = this;
    // These divs are set in the context
    self.player_id = parseInt($("#player-id").attr("val"), 10);
    self.game_id = parseInt($("#game-id").attr("val"), 10);
    self.map_id = parseInt($("#map-id").attr("val"), 10);

    // Do some connecting and make sure we cleanup correctly.

    // DEBUG
    console.log("Connected!");

    self.conn_state = Game.GAME_STATES.CONNECTED;
    $(window).bind("beforeunload", function() {
        data = {
            'game_id': self.game_id
        },
        self.socket.emit('leave', data);
    self.socket.disconnect();
    }.bind(this));

    // Set up the gamestate with an ajax call.
    // This method calls finishInitialization() once the ajax call succeeds.
    self.instantiateGameState();
};

// Let client know someone has joined
Game.prototype.handleUserJoin = function (data) {
    var self = this;
    // DEBUG
    console.log("Someone joined the game at: ", data.timestamp);
    console.log("Player id: ", data.player_id);
    console.log("Joining user's name: ", data.username);

    self.addPlayerToHTML(data.player_id, data.username);
};

// Starting a Game
Game.prototype.handleGameStart = function (data) {
    var self = this;
    // DEBUG
    console.log("Timestamp: ", data.timestamp);

    // Begin rendering and handling user input
    self.renderer.bindClick(self.handleClick.bind(this));
    self.renderer.bindDrag(self.handleDrag.bind(this));
    self.renderer.startRendering(self);

    $('#lobby-container').hide();
    $('#game-container').show();
    self.server_start_time = data.timestamp;
    self.client_start_time = Date.now();
};

//---------------------------------------------
//MANAGING GAME STATE
//---------------------------------------------

Game.prototype.finishInitialization = function() {
    var self = this;
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
    }.bind(this));
};

Game.prototype.instantiateGameState = function() {
    var self = this;
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

Game.prototype.addPlayerToHTML = function(new_player_id, new_player_username) {
    var self = this;
    // DEBUG
    console.log("Updating player names");

    var slot = $("#player-slot-" + new_player_id.toString(10));
    slot.text(new_player_username);
    self.gamestate.players[new_player_id].username = new_player_username;
};

Game.prototype.getUsernameByPid = function(player_id) {
    var self = this;
    return $("#player-slot-" + player_id.toString(10)).text();
};

Game.prototype.populatePlayerNamesInGSFromHTML = function() {
    var self = this;
    // DEBUG
    console.log("Populating player names");

    var usernames = $("#player-usernames");
    var username_list = Array(usernames.children().length);
    for (var index = 0; index < usernames.children().length; index++) {
        self.gamestate.players[index].username = $(usernames.children()[index]).text();
    }
};

//---------------------------------------------
// GAME CILENT INPUT HANDLERS
//---------------------------------------------
Game.prototype.handleClick = function(clicktype, clickpos) {
    var self = this;
    data = {
        'clickpos': clickpos,
        'game_id': self.game_id,
        'player_id': self.player_id,
        'clicktype': clicktype
    };
    self.socket.emit('click', data);
};

Game.prototype.handleDrag = function(clicktype, dragstart, dragend) {
    var self = this;
    data = {
        'dragstart': dragstart,
        'dragend': dragend,
        'game_id': self.game_id,
        'player_id': self.player_id,
        'clicktype': clicktype
    };
    self.socket.emit('drag', data);
};

Game.prototype.handleClickMessage = function (data) {
    var self = this;
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
Game.prototype.moveUnits = function(updateTime, player_id, clickpos) {
    var self = this;
    var unit_list = self.gamestate.players[player_id].selectedUnits;
    unit_list.forEach(function(unit) {
        unit.update(updateTime, clickpos);
    });
};

Game.prototype.handleDragMessage = function(data) {
    var self = this;
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

Game.prototype.handleDisconnect = function () {
    var self = this;
    self.conn_state = Game.GAME_STATES.DISCONNECTED;
};

Game.prototype.handleConnectError = function (e) {
    var self = this;
    // message('System', e ? e : 'An unknown error occurred');
};

//---------------------------------------------
// LOBBY FUNCTIONS
//---------------------------------------------
Game.prototype.start_game = function() {
    var self = this;
    data = {
        'game_id': self.game_id
    };
    self.socket.emit('start', data);
};

