WEB_SOCKET_DEBUG = true;

function Game() { }

// Constants
Game.GAME_STATES = {
    INIT:           0,
    CONNECTING:     1,
    CONNECTED:      2,
    DISCONNECTED:   3
};

Game.prototype.init = function(gs_renderer) {
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

    var listeners = {
        // Connection handling
        'connecting' : 'handleConnecting',
        'connect' : 'handleConnected',

        // Error handling
        'disconnect' : 'handleDisconnect',
        'error' : 'handleConnectError',

        // Game logic handling
        'join' : 'handleUserJoin',
        'start' : 'handleGameStart',
        'click' : 'handleClickMessage',
        'drag' : 'handleDragMessage',
        'key' : 'handleKeyMessage'
    };

    for(var evt in listeners) {
        var listener = this[listeners[evt]];
        this.socket.on(evt, listener.bind(this));
    }

    // DEBUG
    console.log("Init canvas");

    this.ui_renderer = new UIRenderer(document.getElementById('game-ui'));
    this.gs_renderer = gs_renderer || new GSRenderer();
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
    $(window).unload(function() {
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

    this.server_start_time = data.timestamp;
    this.client_start_time = Date.now();

    // set up user input hooks
    this.ui_renderer.bindClick(this.handleClick.bind(this));
    this.ui_renderer.bindDrag(this.handleDrag.bind(this));
    this.ui_renderer.bindKey(this.handleKey.bind(this));

    $('#lobby-container').hide();
    $('#game-container').show();

    //Begin rendering!
    this.ui_renderer.startRendering(this.render.bind(this));
};

Game.prototype.render = function() {
    var self = this;
    var now_time = Date.now();
    var start_time = self.client_start_time;
    // TODO detect bullet collisions and send messages to the server if appropriate.
    var deadUnitIndexList = [];
    self.gamestate.players[self.player_id].units.forEach(function(unit, index) {
        if (unit.deadTime <= (now_time - start_time)) {
            deadUnitIndexList.push(index);
        }
    });
    if (deadUnitIndexList.length > 0) {
        data = {
            'game_id': this.game_id,
            'player_id': this.player_id,
            'deadUnitIndexList': deadUnitIndexList
        };
        self.socket.emit('deadUnits', data);
    }
    var snapshot = self.gamestate.evaluate(now_time - start_time);

    var renderText = function(text) {
        self.ui_renderer.renderText(text, 400, 200, "red");
    };
    self.gs_renderer.update(snapshot);
    self.gs_renderer.animate();
    switch (self.conn_state) {
        case Game.GAME_STATES.CONNECTED:
            self.ui_renderer.renderGS(snapshot);
            self.ui_renderer.renderSelectionCircles(snapshot.players[self.player_id].selectedUnits);
            break;
        case Game.GAME_STATES.INIT:
            renderText("Initializing...");
            break;
        case Game.GAME_STATES.CONNECTING:
            renderText("Connecting...");
            break;
        case Game.GAME_STATES.DISCONNECTED:
            renderText("Disconnected!");
            break;
        default:
            renderText("Problem!");
            break;
    }
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
        url: "/map/" + parseInt(this.map_id, 10),
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
                this.gs_renderer.preload(this.gamestate.toJSON());
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
// GAME CLIENT INPUT HANDLERS
//---------------------------------------------
Game.prototype.handleClick = function(clicktype, clickpos) {
    var data = {
        'clickpos': clickpos,
        'game_id': this.game_id,
        'player_id': this.player_id,
        'clicktype': clicktype
    };
    this.socket.emit('click', data);
};

Game.prototype.handleDrag = function(clicktype, dragstart, dragend) {
    var data = {
        'dragstart': dragstart,
        'dragend': dragend,
        'game_id': this.game_id,
        'player_id': this.player_id,
        'clicktype': clicktype
    };
    this.socket.emit('drag', data);
};

Game.prototype.handleKey = function(keyCode) {
    var data = {
        'game_id': this.game_id,
        'player_id': this.player_id,
        'keycode': keyCode
    };
    this.socket.emit('key', data);
};


//---------------------------------------------
//CALLBACKS FOR WHEN MESSAGES ARE RECEIVED
//---------------------------------------------
Game.prototype.handleClickMessage = function (data) {
    // Get our variables.
    var timestamp = data['timestamp'];
    var player_id = data['player_id'];
    var clickpos = data['clickpos'];
    clickpos = new THREE.Vector3(clickpos.x, clickpos.y, clickpos.z);
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

Game.prototype.handleDragMessage = function(data) {
    // Get our variables.
    var timestamp = data['timestamp'];
    var player_id = data['player_id'];
    var dragstart = data['dragstart'];
    dragstart = new THREE.Vector3(dragstart.x, dragstart.y, dragstart.z);
    var dragend = data['dragend'];
    dragend = new THREE.Vector3(dragend.x, dragend.y, dragend.z);
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

// Move all units in the player_id's unit list that are currently selected to
// the clickpos and execute the update at in-game time updateTime.
Game.prototype.moveUnits = function(updateTime, player_id, clickpos) {
    var unit_list = this.gamestate.players[player_id].selectedUnits;
    unit_list.forEach(function(unit) {
        unit.update(updateTime, clickpos);
    });
    this.updateBullets();
};

// Make sure all bullets are actually detecting collision correctly.
// This method forces all bullets to recalculate their collision paths.
Game.prototype.updateBullets = function() {
    this.gamestate.players.forEach(function(player) {
        player.units.forEach(function(unit) {
            unit.bullets.forEach(function(bullet) {
                bullet.updatePath();
            });
        });
    });
};

Game.prototype.handleKeyMessage = function(data) {
    var timestamp = data['timestamp'];
    var player_id = data['player_id'];
    var keycode = data['keycode'];

    // Find the time at which this message was supposed to be applied.
    var updateTime = timestamp - this.server_start_time;

    // Space bar
    if (keycode === 32) {
        this.shootBullets(updateTime, player_id);
    }
};

Game.prototype.shootBullets = function(updateTime, player_id) {
    var unit_list = this.gamestate.players[player_id].selectedUnits;
    unit_list.forEach(function(unit) {
        unit.shootBullet(updateTime);
    });
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
