//=============================================================================
//                                GAMESTATE
//=============================================================================
function GameState(players, obstacles) {
    this.players = players || [];
    this.players.forEach(function(player, id) {
        player.color = GameState.PLAYER_COLORS[id];
    });
    this.obstacles = obstacles || new Graph();
}
GameState.PLAYER_COLORS =
    ['rgb(255, 0, 0)',
     'rgb(0, 0, 255)',
     'rgb(0, 128, 0)',
     'rgb(0, 255, 255)',
     'rgb(255, 0, 255)',
     'rgb(255, 255, 0)',
     'rgb(255, 128, 0)',
     'rgb(0, 128, 255)',
     'rgb(128, 0, 255)'];

// Takes a JSON object created by gamestate.toJSON() and converts it back into a GameState.
GameState.fromJSON = function(map_data) {
    var theGamestate = new GameState(null, Graph.fromJSON(map_data.obstacles));
    var new_player_list = map_data.players.map(function(player) {
        return Player.fromJSON(player, theGamestate);
    });
    theGamestate.players = new_player_list;
    theGamestate.players.forEach(function(player, id) {
        player.color = GameState.PLAYER_COLORS[id];
    });
    return theGamestate;
};

GameState.prototype.toJSON = function() {
    var evaluated = this.evaluate(0);
    evaluated.obstacles = evaluated.obstacles.toJSON();
    return evaluated;
};

GameState.prototype.evaluate = function(t) {
    return {
        players: this.players.map(function (player) { return player.evaluate(t); }),
        obstacles: this.obstacles
    };
};

GameState.prototype.addUnit = function(player, position) {
    var unit = new Unit(position, player);
    player.units.push(unit);
    return unit;
};

GameState.prototype.addWall = function(startPos, endPos) {
    var startNode = new Node(startPos);
    var endNode = new Node(endPos);
    this.obstacles.addNode(startNode);
    this.obstacles.addNode(endNode);
    startNode.addConnection(endNode);
};


//=============================================================================
//                                PLAYER
//=============================================================================
function Player(units, gamestate) {
    // Store the gamestate that this player is in
    this.gamestate = gamestate;
    this.units = units || [];
    this.selectedUnits = [];
}

Player.fromJSON = function(player_data, gamestate) {
    var thePlayer = new Player(null, gamestate);
    var new_unit_list = player_data.units.map(function(unit) {
        return Unit.fromJSON(unit, thePlayer);
    });
    thePlayer.units = new_unit_list;
    return thePlayer;
};

Player.prototype.toJSON = function() {
    return this.evaluate(0);
};

Player.prototype.evaluate = function(t) {
    return {
        selectedUnits: this.selectedUnits.map(function(unit) { return unit.evaluate(t); }),
        units: this.units.map(function (unit) { return unit.evaluate(t); }),
        color: this.color
    };
};

//=============================================================================
//                                UNIT
//=============================================================================
function Unit(init_pos, player, speed, size) {
    // store the player that controls this unit.
    this.player = player;
    // arbitrary speed for unit movement
    this.speed = speed || 0.3;
    // arbitrary unit radius size for collision
    this.size = size || 15;
    // Create a path builder
    this.path = new PathBuilder();
    this.path.addPath(new LinearPath(init_pos, init_pos, this.speed, 0));
    // initial position function is constant
    this.pos = function(t) {
        return this.path.getPos(t);
    }.bind(this);
    // inital facing is straight down
    this.facing = function(t) {
        return this.path.getFacing(t);
    }.bind(this);
}

// Returns false if the destination is unreachable. True otherwise.
// Also, this will update the units path to point to the destination
// position starting at time t and avoiding obstacles.
Unit.prototype.update = function(t, destination) {
    // Obtain each node in the position list.
    var start = this.pos(t);
    var node_list = getPath(start, destination, this.player.gamestate.obstacles);
    if (node_list === null) {
        return false;
    }
    var pos_list = node_list.map(function(node) { return node.pos; });

    // Set the variables needed.
    var prev_pos = start;
    this.path = new PathBuilder();
    pos_list.forEach(function(pos) {
        this.path.addPath(new LinearPath(prev_pos, pos, this.speed, t));
        t = t + prev_pos.clone().sub(pos).length() / this.speed;
        prev_pos = pos;
    }.bind(this));
    return true;
};

Unit.fromJSON = function(unit_data, player) {
    var vect = THREE.Vector3.fromJSON(unit_data.pos);
    var speed = unit_data.speed; //possibly undefined
    var size = unit_data.size;
    return new Unit(vect, player, speed, size);
};

Unit.prototype.toJSON = function() {
    return this.evaluate(0);
};

Unit.prototype.evaluate = function(t) {
    var position = this.pos(t);
    return {
        speed: this.speed,
        pos: position.toJSON(),
        facing: this.facing(t),
        size: this.size
    };
};

//=============================================================================
//                  EVALUATED GAMESTATE FUNCTIONS
//=============================================================================

function getAllUnits(gamestate) {
    return [].concat.apply([], gamestate.players.map(function (player) { return player.units; }));
}

function unitsInSphere(gamestate, origin, radius) {
    return getAllUnits(gamestate).filter(function (unit) {
        return THREE.Vector3.fromJSON(unit.pos).sub(origin).length() < radius;
    });
}
