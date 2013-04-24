WEB_SOCKET_DEBUG = true;

function Game() { }

// Constants
Game.GAME_STATES = {
    INIT:           0,
    CONNECTING:     1,
    CONNECTED:      2,
    DISCONNECTED:   3
};

Game.KEY_CODES = {
    W: 87,
    A: 65,
    S: 83,
    D: 68
};

Game.prototype.init = function(gs_renderer) {
    //---------------------------------------------
    //INITIALIZE SOCKET.IO
    //---------------------------------------------
    this.conn_state = Game.GAME_STATES.INIT;
    this.keys = {};
    this.keys.w = false;
    this.keys.a = false;
    this.keys.s = false;
    this.keys.d = false;

    this.socket = io.connect('/game', {
        reconnect: false
    });
    // DEBUG
    // console.log("Attempting to connect");

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
        'deadUnits' : 'handleDeadUnits',
        'lostGame' : 'handleLostGame',
        'wonGame' : 'handleWonGame',
        'key' : 'handleKeyUpMessage'
    };

    for(var evt in listeners) {
        var listener = this[listeners[evt]];
        this.socket.on(evt, listener.bind(this));
    }

    // DEBUG
    // console.log("Init canvas");

    this.ui_renderer = new UIRenderer(document.getElementById('game-ui'));
    this.gs_renderer = gs_renderer || new GSRenderer();
};

//This method gets called as soon
Game.prototype.handleConnecting = function() {
    // DEBUG
    // console.log("Connecting...");

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
    // console.log("Connected!");

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
    // console.log("Someone joined the game at: ", data.timestamp);
    // console.log("Player id: ", data.player_id);
    // console.log("Joining user's name: ", data.username);

    this.addPlayerToHTML(data.player_id, data.username);
};

// Starting a Game
Game.prototype.handleGameStart = function (data) {
    // DEBUG
    // console.log("Timestamp: ", data.timestamp);

    this.server_start_time = data.timestamp;
    this.client_start_time = Date.now();

    // set up user input hooks
    this.ui_renderer.bindClick(this.handleClick.bind(this));
    this.ui_renderer.bindDrag(this.handleDrag.bind(this));
    this.ui_renderer.bindKeyUp(this.handleKeyUp.bind(this));
    this.ui_renderer.bindKeyDown(this.handleKeyDown.bind(this));

    $('#lobby-container').hide();
    $('#game-container').show();

    //Begin rendering!
    this.ui_renderer.startRendering(this.renderMethod.bind(this));
};

Game.prototype.renderMethod = function() {
    var self = this;
    var now_time = Date.now();
    var start_time = self.client_start_time;

    // Detect bullet collisions and send messages to the server if appropriate.
    var deadUnitIndexList = [];
    self.gamestate.players[self.player_id].units.forEach(function(unit, index) {
        if (unit.deadTime && unit.deadTime <= (now_time - start_time)) {
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

    // If we've lost the game, send that message to the server.
    if (self.loseCondition()) {
        data = {
            'game_id': this.game_id,
            'player_id': this.player_id
        };
        self.socket.emit('lostGame', data);
    }

    // If we've won the game, send that message to the server.
    if (self.winCondition()) {
        data = {
            'game_id': this.game_id,
            'player_id': this.player_id
        };
        self.socket.emit('wonGame', data);
    }

    // Render this snapshot of the gamestate.
    var snapshot = self.gamestate.evaluate(now_time - start_time);

    var renderText = function(text) {
        self.ui_renderer.renderText(text, 400, 200, "red");
    };
    self.gs_renderer.update(snapshot);
    self.gs_renderer.animate();
    switch (self.conn_state) {
        case Game.GAME_STATES.CONNECTED:
            self.ui_renderer.renderSelectRect();
            var d1 = new THREE.Vector3(0, 0, 0);
            var d2 = new THREE.Vector3(window.innerWidth, 0, 0);
            var d3 = new THREE.Vector3(window.innerWidth, window.innerHeight, 0);
            var d4 = new THREE.Vector3(0, window.innerHeight, 0);
            d1 = self.gs_renderer.project(d1);
            d2 = self.gs_renderer.project(d2);
            d3 = self.gs_renderer.project(d3);
            d4 = self.gs_renderer.project(d4);

            // self.ui_renderer.renderText("d1 x: " + d1.x + ", y: " + d1.y, 400, 200, "red");
            // self.ui_renderer.renderText("d2 x: " + d2.x + ", y: " + d2.y, 400, 220, "red");
            // self.ui_renderer.renderText("d3 x: " + d3.x + ", y: " + d3.y, 400, 240, "red");
            // self.ui_renderer.renderText("d4 x: " + d4.x + ", y: " + d4.y, 400, 260, "red");

            self.ui_renderer.renderMap();
            self.ui_renderer.renderViewPort(d1, d2, d3, d4);
            self.ui_renderer.renderGS(snapshot);
            self.ui_renderer.renderSelectionCircles(snapshot.players[self.player_id].selectedUnits);

            var delta = new THREE.Vector3(0, 0, 0);
            if (this.keys.w) {
                delta.y += 100;
            }
            if (this.keys.a) {
                delta.x -= 100;
            }
            if (this.keys.s) {
                delta.y -= 100;
            }
            if (this.keys.d) {
                delta.x += 100;
            }
            var pos = self.gs_renderer.getViewport();
            self.gs_renderer.setViewport(pos.x + delta.x, pos.y + delta.y);
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
        // console.log("start game");

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
                // console.log("putting the following into window.map_data: " + map_data_json);
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
    // console.log("Updating player names");

    var slot = $("#player-slot-" + new_player_id.toString(10));
    slot.text(new_player_username);
    this.gamestate.players[new_player_id].username = new_player_username;
};

Game.prototype.getUsernameByPid = function(player_id) {
    return $("#player-slot-" + player_id.toString(10)).text();
};

Game.prototype.populatePlayerNamesInGSFromHTML = function() {
    // DEBUG
    // console.log("Populating player names");

    var usernames = $("#player-usernames");
    for (var index = 0; index < usernames.children().length; index++) {
        this.gamestate.players[index].username = $(usernames.children()[index]).text();
    }
};

//---------------------------------------------
// GAME CLIENT INPUT HANDLERS
//---------------------------------------------
Game.prototype.handleClick = function(clicktype, clickpos) {
    var worldPos = this.gs_renderer.project(clickpos);
    data = {
        'clickpos': worldPos,
        'game_id': this.game_id,
        'player_id': this.player_id,
        'clicktype': clicktype
    };
    this.socket.emit('click', data);
};

Game.getRect = function(c1, c2) {
    return {
        "p1": new THREE.Vector3(Math.min(c1.x, c2.x), Math.min(c1.y, c2.y)),
        "p2": new THREE.Vector3(Math.max(c1.x, c2.x), Math.max(c1.y, c2.y))
    };
};

Game.prototype.handleDrag = function(clicktype, dragstart, dragend) {
    var rect = Game.getRect(dragstart, dragend);
    var drag_p1 = new THREE.Vector3(rect.p1.x, rect.p1.y, 0);
    var drag_p2 = new THREE.Vector3(rect.p2.x, rect.p1.y, 0);
    var drag_p3 = new THREE.Vector3(rect.p2.x, rect.p2.y, 0);
    var drag_p4 = new THREE.Vector3(rect.p1.x, rect.p2.y, 0);
    drag_p1 = this.gs_renderer.project(drag_p1);
    drag_p2 = this.gs_renderer.project(drag_p2);
    drag_p3 = this.gs_renderer.project(drag_p3);
    drag_p4 = this.gs_renderer.project(drag_p4);
    data = {
        'drag_p1': drag_p1,
        'drag_p2': drag_p2,
        'drag_p3': drag_p3,
        'drag_p4': drag_p4,
        'game_id': this.game_id,
        'player_id': this.player_id,
        'clicktype': clicktype
    };
    this.socket.emit('drag', data);
};

Game.prototype.handleKeyUp = function(keyCode) {
    if (keyCode === Game.KEY_CODES.W) {
        this.keys.w = false;
    }
    if (keyCode === Game.KEY_CODES.A) {
        this.keys.a = false;
    }
    if (keyCode === Game.KEY_CODES.S) {
        this.keys.s = false;
    }
    if (keyCode === Game.KEY_CODES.D) {
        this.keys.d = false;
    }
    var data = {
        'game_id': this.game_id,
        'player_id': this.player_id,
        'keycode': keyCode
    };
    this.socket.emit('key', data);
};

Game.prototype.handleKeyDown = function(keyCode) {
    if (keyCode === Game.KEY_CODES.W) {
        this.keys.w = true;
    }
    if (keyCode === Game.KEY_CODES.A) {
        this.keys.a = true;
    }
    if (keyCode === Game.KEY_CODES.S) {
        this.keys.s = true;
    }
    if (keyCode === Game.KEY_CODES.D) {
        this.keys.d = true;
    }
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

    var drag_p1 = data['drag_p1'];
    drag_p1 = new THREE.Vector3(drag_p1.x, drag_p1.y, drag_p1.z);
    var drag_p2 = data['drag_p2'];
    drag_p2 = new THREE.Vector3(drag_p2.x, drag_p2.y, drag_p2.z);
    var drag_p3 = data['drag_p3'];
    drag_p3 = new THREE.Vector3(drag_p3.x, drag_p3.y, drag_p3.z);
    var drag_p4 = data['drag_p4'];
    drag_p4 = new THREE.Vector3(drag_p4.x, drag_p4.y, drag_p4.z);

    var clicktype = data['clicktype'];

    // Find the time at which this message was supposed to be applied.
    var updateTime = timestamp - this.server_start_time;

    // On left mouse drag
    if (clicktype === 1) {
        GS_UI.selectUnits(this.gamestate.players[player_id], updateTime, drag_p1, drag_p2, drag_p3, drag_p4);
    }
    // On right mouse drag
    if (clicktype === 3) {
        this.moveUnits(updateTime, player_id, drag_p4);
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
    this.gamestate.cleanUp(updateTime);
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

Game.prototype.handleKeyUpMessage = function(data) {
    var timestamp = data['timestamp'];
    var player_id = data['player_id'];
    var keycode = data['keycode'];

    // Find the time at which this message was supposed to be applied.
    var updateTime = timestamp - this.server_start_time;

    // Space bar
    if (keycode === 32) {
        this.shootBullets(updateTime, playehandleKeyUpMessr_id);
    }
};

Game.prototype.shootBullets = function(updateTime, player_id) {
    var unit_list = this.gamestate.players[player_id].selectedUnits;
    unit_list.forEach(function(unit) {
        unit.shootBullet(updateTime);
    });
};

Game.prototype.handleDeadUnits = function(data) {
    var timestamp = data['timestamp'];
    var player_id = data['player_id'];
    var deadUnitIndexList = data['deadUnitIndexList'];

    var player = this.gamestate.players[player_id];
    player.units = player.units.filter(function(unit, index) {
        return deadUnitIndexList.indexOf(index) === -1;
    });
};

Game.prototype.loseCondition = function() {
    var player = this.gamestate.players[this.player_id];
    return player.units.length === 0;
};

Game.prototype.winCondition = function() {
    var players = this.gamestate.players.filter(function(player, index) {
        return index !== this.player_id;
    }.bind(this));
    var won = true;
    players.every(function(player) {
        won = player.units.length === 0;
        return won;
    });
    return won;
};

Game.prototype.handleLostGame = function(data) {
    var timestamp = data['timestamp'];
    var player_id = data['player_id'];
    // TODO
};

Game.prototype.handleWonGame = function(data) {
    var timestamp = data['timestamp'];
    var player_id = data['player_id'];
    // TODO
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
