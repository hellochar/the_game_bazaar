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
    //---------------------------------------------
    //INITIALIZE SOCKET.IO
    //---------------------------------------------
    this.conn_state = Game.GAME_STATES.INIT;

    this.socket = io.connect('/game', {
        reconnect: false
    });
    // DEBUG
    console.log("Attempting to connect");

    // BIND HANDLERS FOR SOCKET EVENTS

    // Connection handling
    this.socket.on('connecting', this.handleConnecting.bind(this));
    this.socket.on('connect', this.handleConnected.bind(this));
    // Error handling
    this.socket.on('disconnect', this.handleDisconnect.bind(this));
    this.socket.on('error', this.handleConnectError.bind(this));

    // Game logic handling
    this.socket.on('join', this.handleUserJoin.bind(this));
    this.socket.on('start', this.handleGameStart.bind(this));
    this.socket.on('click', this.handleClickMessage.bind(this));
    this.socket.on('drag', this.handleDragMessage.bind(this));


    // DEBUG
    console.log("Init canvas");

    this.renderer = new Renderer();

};

//This method gets called as soon 
Game.prototype.handleConnecting = function() {
    // DEBUG
    console.log("Connecting...");

    this.conn_state = Game.GAME_STATES.CONNECTING;
};

//---------------------------------------------
//MANAGING LOBBY STATE
//---------------------------------------------

//join the lobby as soon as we connect
Game.prototype.handleConnected = function () {
    // These divs are set in the context
    this.player_id = parseInt($("#player-id").attr("val"), 10);
    this.game_id = parseInt($("#game-id").attr("val"), 10);
    this.map_id = parseInt($("#map-id").attr("val"), 10);

    // Do some connecting and make sure we cleanup correctly.

    // DEBUG
    console.log("Connected!");

    this.conn_state = Game.GAME_STATES.CONNECTED;
    $(window).bind("beforeunload", function() {
        data = {
            'game_id': this.game_id
        };
        this.socket.emit('leave', data);
        this.socket.disconnect();
    }.bind(this));

    // Set up the gamestate with an ajax call.
    // This method calls finishInitialization() once the ajax call succeeds.
    this.instantiateGameState();
};

// Let client know someone has joined
Game.prototype.handleUserJoin = function (data) {
    // DEBUG
    console.log("Someone joined the game at: ", data.timestamp);
    console.log("Player id: ", data.player_id);
    console.log("Joining user's name: ", data.username);

    this.addPlayerToHTML(data.player_id, data.username);
};

// Starting a Game
Game.prototype.handleGameStart = function (data) {
    // DEBUG
    console.log("Timestamp: ", data.timestamp);

    // Begin rendering and handling user input
    this.renderer.bindClick(this.handleClick.bind(this));
    this.renderer.bindDrag(this.handleDrag.bind(this));
    this.renderer.startRendering(this);

    $('#lobby-container').hide();
    $('#game-container').show();
    this.server_start_time = data.timestamp;
    this.client_start_time = Date.now();
};

//---------------------------------------------
//MANAGING GAME STATE
//---------------------------------------------

//Send a 'join' message to everyone, bind events to the 'start game' button
Game.prototype.finishInitialization = function() {
    // Broadcast a join
    // If the user is the game owner, no one else should be in the game
    data = {
        'game_id': this.game_id,
        'player_id': this.player_id,
        'username': this.getUsernameByPid(this.player_id)
    };
    this.socket.emit('join', data);

    $('#start-game').click(function() {
        // DEBUG
        console.log("start game");

        this.start_game();
    }.bind(this));
};

Game.prototype.instantiateGameState = function() {
    this.gamestate = false;
    $.ajax({
        type: "GET",
        url: "/map",
        data: {
            "map_id": parseInt(this.map_id, 10)
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

                this.gamestate = GameState.fromJSON(map_data_json);

                // DEBUG
                window.gamestate = this.gamestate;

                this.populatePlayerNamesInGSFromHTML();
                this.finishInitialization();
            }
            else {
                $("#game-id").text('ERROR: Could not load that map id');
            }
            return false;
        }.bind(this)
    });
};

Game.prototype.addPlayerToHTML = function(new_player_id, new_player_username) {
    // DEBUG
    console.log("Updating player names");

    var slot = $("#player-slot-" + new_player_id.toString(10));
    slot.text(new_player_username);
    this.gamestate.players[new_player_id].username = new_player_username;
};

Game.prototype.getUsernameByPid = function(player_id) {
    return $("#player-slot-" + player_id.toString(10)).text();
};

Game.prototype.populatePlayerNamesInGSFromHTML = function() {
    // DEBUG
    console.log("Populating player names");

    var usernames = $("#player-usernames");
    for (var index = 0; index < usernames.children().length; index++) {
        this.gamestate.players[index].username = $(usernames.children()[index]).text();
    }
};

//---------------------------------------------
// GAME CILENT INPUT HANDLERS
//---------------------------------------------
Game.prototype.handleClick = function(clicktype, clickpos) {
    data = {
        'clickpos': clickpos,
        'game_id': this.game_id,
        'player_id': this.player_id,
        'clicktype': clicktype
    };
    this.socket.emit('click', data);
};

Game.prototype.handleDrag = function(clicktype, dragstart, dragend) {
    data = {
        'dragstart': dragstart,
        'dragend': dragend,
        'game_id': this.game_id,
        'player_id': this.player_id,
        'clicktype': clicktype
    };
    this.socket.emit('drag', data);
};

Game.prototype.handleClickMessage = function (data) {
    // Get our variables.
    var timestamp = data['timestamp'];
    var player_id = data['player_id'];
    var clickpos = data['clickpos'];
    var clicktype = data['clicktype'];
    // Find the time at which this message was supposed to be applied.
    var updateTime = timestamp - this.server_start_time;
    // Update the game state.
    // On right click
    if (clicktype === 3) {
        this.moveUnits(updateTime, player_id, clickpos);
    }
    // On left click
    if (clicktype === 1) {
        GS_UI.selectUnit(this.gamestate.players[player_id], updateTime, clickpos);
    }
};

// Move all units in the player_id's unit list that are currently selected to
// the clickpos and execute the update at in-game time updateTime.
Game.prototype.moveUnits = function(updateTime, player_id, clickpos) {
    var unit_list = this.gamestate.players[player_id].selectedUnits;
    unit_list.forEach(function(unit) {
        unit.update(updateTime, clickpos);
    });
};

Game.prototype.handleDragMessage = function(data) {
    // Get our variables.
    var timestamp = data['timestamp'];
    var player_id = data['player_id'];
    var dragstart = data['dragstart'];
    var dragend = data['dragend'];
    var clicktype = data['clicktype'];

    // Find the time at which this message was supposed to be applied.
    var updateTime = timestamp - this.server_start_time;

    // On left mouse drag
    if (clicktype === 1) {
        GS_UI.selectUnits(this.gamestate.players[player_id], updateTime, dragstart, dragend);
    }
    // On right mouse drag
    if (clicktype === 3) {
        this.moveUnits(updateTime, player_id, dragend);
    }
};


//---------------------------------------------
//SOCKET.IO ERROR CATCHING
//---------------------------------------------

Game.prototype.handleDisconnect = function () {
    this.conn_state = Game.GAME_STATES.DISCONNECTED;
};

Game.prototype.handleConnectError = function (e) {
    // message('System', e ? e : 'An unknown error occurred');
};

//---------------------------------------------
// LOBBY FUNCTIONS
//---------------------------------------------
Game.prototype.start_game = function() {
    data = {
        'game_id': this.game_id
    };
    this.socket.emit('start', data);
};
