WEB_SOCKET_DEBUG = true;

function Game(game_id) {
    this.game_id = parseInt(game_id, 10);
}

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

    this.socket = io.connect('/game?id='+this.game_id, {
        reconnect: false, // Do not reconnect
        'sync disconnect on unload': true // On unload send a disconnect packet
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
        'game_data' : 'handleGameData',
        'leave' : 'handleUserLeave',
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
    // This array is used for storing all units that are dead, and we've sent a message
    // to the server saying that they are dead, but we haven't received the deadUnit message
    // from the server yet to remove them from the gamestate.
    // This is necessary because if the renderer sends a duplicate unitDead message, bad
    // stuff can happen.
    this.waitingForDeadUnits = [];
};

//This method gets called as soon
Game.prototype.handleConnecting = function() {
    // DEBUG
    // console.log("Connecting...");

    this.conn_state = Game.GAME_STATES.CONNECTING;
    $('#loading-message').text("Connecting...");
};

//---------------------------------------------
//MANAGING LOBBY STATE
//---------------------------------------------

//join the lobby as soon as we connect
Game.prototype.handleConnected = function () {
    // DEBUG
    // console.log("Connected!");

    this.conn_state = Game.GAME_STATES.CONNECTED;
    $(window).unload(function() {
        this.socket.emit('leave');
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

    this.addPlayer(data.player_id, data.username);
};

// Let client know someone has joined
Game.prototype.handleUserLeave = function (data) {
    // DEBUG
    // console.log("Someone joined the game at: ", data.timestamp);
    // console.log("Player id: ", data.player_id);
    // console.log("Joining user's name: ", data.username);

    this.rmPlayer(data.player_id);
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

    // Hide the lobby and show the game
    $('#lobby-container').hide();
    $('#game-container').show();

    //Begin rendering!
    this.ui_renderer.startRendering(this.renderMethod.bind(this));
};

// If one of this player's units is expired, send the deadUnit message to the
// server.
Game.prototype.checkDeadUnits = function(game_time) {
    // Detect bullet collisions and send messages to the server if appropriate.
    var deadUnitIndexList = [];
    this.gamestate.players[this.player_id].units.forEach(function(unit, index) {
        if (this.waitingForDeadUnits.indexOf(unit) !== -1) {
            return;
        }
        if (unit.deadTime && unit.deadTime <= (game_time)) {
            deadUnitIndexList.push(index);
            this.waitingForDeadUnits.push(unit);
        }
    }.bind(this));
    if (deadUnitIndexList.length > 0) {
        data = {
            'deadUnitIndexList': deadUnitIndexList
        };
        this.socket.emit('deadUnits', data);
    }
};

// If this player has won or has lost, send the win or lose message to the
// server.
Game.prototype.checkWinAndLose = function() {
    // If we've lost the game, send that message to the server.
    // Make sure that we only send this message once. i.e. if we've already
    // lost, stop sending the lostGame message.
    if (this.loseCondition() && !this.gamestate.players[this.player_id].lost) {
        this.socket.emit('lostGame');
    }

    // If we've won the game, send that message to the server.
    // Make sure that we only send this message once. i.e. if we've already
    // won, stop sending the wonGame message.
    if (this.winCondition() && !this.gamestate.players[this.player_id].won) {
        this.socket.emit('wonGame');
    }
};

Game.prototype.renderMethod = function() {
    var now_time = Date.now();
    var start_time = this.client_start_time;

    this.checkDeadUnits(now_time - start_time);
    this.checkWinAndLose();

    // Render this snapshot of the gamestate.
    var snapshot = this.gamestate.evaluate(now_time - start_time);

    var renderText = function(text) {
        this.ui_renderer.renderText(text, 400, 200, "red");
    };
    this.gs_renderer.update(snapshot);
    this.gs_renderer.animate();

    this.ui_renderer.renderSelectRect();
    var d1 = new THREE.Vector3(0, 0, 0);
    var d2 = new THREE.Vector3(window.innerWidth, 0, 0);
    var d3 = new THREE.Vector3(window.innerWidth, window.innerHeight, 0);
    var d4 = new THREE.Vector3(0, window.innerHeight, 0);
    d1 = this.gs_renderer.project(d1);
    d2 = this.gs_renderer.project(d2);
    d3 = this.gs_renderer.project(d3);
    d4 = this.gs_renderer.project(d4);

    // this.ui_renderer.renderText("d1 x: " + d1.x + ", y: " + d1.y, 400, 200, "red");
    // this.ui_renderer.renderText("d2 x: " + d2.x + ", y: " + d2.y, 400, 220, "red");
    // this.ui_renderer.renderText("d3 x: " + d3.x + ", y: " + d3.y, 400, 240, "red");
    // this.ui_renderer.renderText("d4 x: " + d4.x + ", y: " + d4.y, 400, 260, "red");

    this.ui_renderer.renderMap();
    this.ui_renderer.renderViewPort(d1, d2, d3, d4);
    this.ui_renderer.renderGS(snapshot, this.player_id);
    this.ui_renderer.renderSelectionCircles(snapshot.players[this.player_id].selectedUnits);

    var delta = new THREE.Vector3(0, 0, 0);
    if (this.keys.w) {
        delta.y += 40;
    }
    if (this.keys.a) {
        delta.x -= 40;
    }
    if (this.keys.s) {
        delta.y -= 40;
    }
    if (this.keys.d) {
        delta.x += 40;
    }
    var pos = this.gs_renderer.getViewport();
    this.gs_renderer.setViewport(pos.x + delta.x, pos.y + delta.y);
};

//---------------------------------------------
//MANAGING GAME STATE
//---------------------------------------------

// When the game is ready, bind events to the 'start game' button
Game.prototype.finishInitialization = function() {
    $('#lobby-container').show();
    $('#loading-container').hide();
    $('#start-game').click(function() {
        // DEBUG
        // console.log("start game");

        this.start_game();
    }.bind(this));
};

// Starting a Game
Game.prototype.handleGameData = function (gameData) {
    // DEBUG
    // console.log("Timestamp: ", data.timestamp);

    // Load essential game data from the socket
    this.isHost = gameData.isHost;
    this.map_id = gameData.map_id;
    this.player_id = gameData.player_id;

    // Make an ajax call to load the map data from the server
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
                this.gs_renderer.initialize(this.gamestate.evaluate(0));

                this.populatePlayers(gameData.player_list);

                // Show different screens depending on whether or not the player is the host
                if (this.isHost) {
                    $('#lobby-host-screen').show();
                    $('#lobby-pleb-screen').hide();
                } else {
                    $('#lobby-host-screen').hide();
                    $('#lobby-pleb-screen').show();
                }

                this.finishInitialization();
            }
            else {
                $("#game-id").text('ERROR: Could not load that map id');
            }
            return false;
        }.bind(this)
    });
};

Game.prototype.instantiateGameState = function() {
    this.gamestate = false;
    // Send a 'join' game message
    // If the user is the game owner, no one else should be in the game
    this.socket.emit('join');
};

Game.prototype.populatePlayers = function(player_list) {
    player_list.forEach(function(player, pid) {
        var field = document.createElement('li');
        field.id = "player-slot-" + pid;
        $(field).text(player);
        $('#player-usernames').append(field);
        this.gamestate.players[pid].username = player;
    }.bind(this));
};

Game.prototype.addPlayer = function(new_player_id, new_player_username) {
    // DEBUG
    // console.log("Updating player names");

    var slot = $("#player-slot-" + new_player_id.toString(10));
    slot.text(new_player_username);
    this.gamestate.players[new_player_id].username = new_player_username;
};

Game.prototype.rmPlayer = function(player_id) {
    // DEBUG
    // console.log("Updating player names");

    var slot = $("#player-slot-" + player_id.toString(10));
    slot.text("");
    this.gamestate.players[player_id].username = "";
};


// Game.prototype.getUsernameByPid = function(player_id) {
//     return $("#player-slot-" + player_id.toString(10)).text();
// };

// Game.prototype.populatePlayerNamesInGSFromHTML = function() {
//     // DEBUG
//     // console.log("Populating player names");

//     var usernames = $("#player-usernames");
//     for (var index = 0; index < usernames.children().length; index++) {
//         this.gamestate.players[index].username = $(usernames.children()[index]).text();
//     }
// };

//---------------------------------------------
// GAME CLIENT INPUT HANDLERS
//---------------------------------------------
Game.prototype.handleClick = function(clicktype, clickpos) {
    var worldPos = this.gs_renderer.project(clickpos);
    data = {
        'clickpos': worldPos,
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
        this.shootBullets(updateTime, player_id);
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
        var alive = deadUnitIndexList.indexOf(index) === -1;
        if (!alive) {
            // Remove references to the dead unit.
            unit.bullets.forEach(function(bullet) {
                bullet.collidedUnit.deadTime = false;
                bullet.collidedUnit.killingBullet = false;
                bullet.collidedUnit = false;
            });

            // Remove the other bullet from the gamestate.
            var others_list = unit.killingBullet.unit.bullets;
            unit.killingBullet.unit.bullets = others_list.filter(function(other_bullet) {
                return other_bullet !== unit.killingBullet;
            });

            // Remove the dead unit from the selected units
            player.selectedUnits = player.selectedUnits.filter(function(selected_unit) {
                return selected_unit !== unit;
            });

            // If we received and updated the dead unit, remove it from the deadUnitQueue.
            if (player_id === this.player_id) {
                this.waitingForDeadUnits = this.waitingForDeadUnits.filter(function(dead_unit) {
                    return dead_unit !== unit;
                });
            }
        }
        return alive;
    }.bind(this));

    this.updateBullets();
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
        won = player.state === PlayerState.LOST;
        return won;
    });
    return won;
};

Game.prototype.handleLostGame = function(data) {
    var timestamp = data['timestamp'];
    var player_id = data['player_id'];
    this.gamestate.players[player_id].state = PlayerState.LOST;
};

Game.prototype.handleWonGame = function(data) {
    var timestamp = data['timestamp'];
    var player_id = data['player_id'];
    this.gamestate.players[player_id].state = PlayerState.WON;
};


//---------------------------------------------
//SOCKET.IO ERROR CATCHING
//---------------------------------------------

Game.prototype.handleDisconnect = function () {
    this.conn_state = Game.GAME_STATES.DISCONNECTED;
    // Just show the loading cantainer again on a disconnect
    // No need to hide the other containers unless needed
    $('#loading-container').show();
    $('#loading-message').text("Connecting...");
};

Game.prototype.handleConnectError = function (e) {
    // message('System', e ? e : 'An unknown error occurred');
};

//---------------------------------------------
// LOBBY FUNCTIONS
//---------------------------------------------
Game.prototype.start_game = function() {
    this.socket.emit('start');
};
