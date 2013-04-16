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
function Unit(init_pos, player) {
    // store the player that controls this unit.
    this.player = player;
    // cooldown for shooting
    this.cooldown = 1;
    // counter for when the last time this unit shot was.
    // it starts at -cooldown because they are ready at time 0.
    this.lastShot = -this.cooldown;
    // the list of bullets that this unit has fired
    this.bulletList = [];
    // arbitrary speed for unit movement
    this.speed = 0.1;
    // arbitrary unit radius size for collision
    this.size = 15;
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

Unit.prototype.shootBullet = function(startTime) {
    var bullet = new Bullet(startTime, this.pos(startTime), this);
    this.bulletList.push(bullet);
};

Unit.fromJSON = function(unit_data, player) {
    var vect = new THREE.Vector3(unit_data.pos.x, unit_data.pos.y, unit_data.pos.z);
    return new Unit(vect, player);
};

Unit.prototype.toJSON = function() {
    return this.evaluate(0);
};

Unit.prototype.evaluate = function(t) {
    var position = this.pos(t);
    var filteredBullets = this.bulletList.filter(function(bullet) {
        return (bullet.endTime >= t && bullet.startTime <= t);
    }.bind(t));
    var mappedBullets = filteredBullets.map(function(bullet){
        return bullet.evaluate(t);
    }.bind(t));
    return {
        speed: this.speed,
        pos: {'x': position.x, 'y': position.y, 'z': position.z},
        facing: this.facing(t),
        bullets: mappedBullets,
        size: this.size
    };
};

//=============================================================================
//                                BULLET
//=============================================================================

function Bullet(startTime, startPos, unit) {
    // the maximum distance a bullet can go (in pixels)
    this.range = 1000;
    // the speed this bullet travels at.
    this.speed = 0.6;
    // the unit that created this bullet
    this.unit = unit;
    // the time at which this bullet was created
    this.startTime = startTime;
    // the path this bullet will travel
    this.path = new PathBuilder();
    var angle = this.unit.facing(startTime);
    var v = new THREE.Vector3(Math.cos(angle) * this.range, Math.sin(angle) * this.range);
    var endPos = startPos.clone().add(v);

    // Check whether our trajectory hits an obstacle.
    // TODO
    // Check whether our trajectory hits a unit.
    // TODO

    this.path.addPath(new LinearPath(startPos, endPos, this.speed, this.startTime));
    // the time at which this bullet should stop being rendered/removed from the bullet list.
    this.endTime = this.path.getEndTime();
}

Bullet.prototype.evaluate = function(t) {
    return {
        pos: this.path.getPos(t),
        facing: this.path.getFacing(t)
    };
};
