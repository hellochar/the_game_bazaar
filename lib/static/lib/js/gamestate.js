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
    return new GameState(map_data.players.map(Player.fromJSON), Graph.fromJSON(map_data.obstacles));
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
    var unit = new Unit(position);
    player.units.push(unit);
    return unit;
};

GameState.prototype.addWall = function(startPos, endPos) {
    var startNode = new Node(startPos);
    var endNode = new Node(endPos);
    this.obstacles.addNode(startNode);
    this.obstacles.addNode(endNode);
    startNode.addConnection(endNode);
}


//=============================================================================
//                                PLAYER
//=============================================================================
function Player(units) {
    this.units = units || [];
    this.selectedUnits = [];
}

Player.fromJSON = function(player_data) {
    return new Player(player_data.units.map(Unit.fromJSON));
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
function Unit(init_pos) {
    var self = this;
    // arbitrary speed for unit movement
    self.speed = 0.3;
    // arbitrary unit radius size for collision
    self.size = 15;
    // Create a path builder
    self.path = new PathBuilder();
    self.path.addPath(new LinearPath(init_pos, init_pos, self.speed, 0));
    // initial position function is constant
    self.pos = function(t) {
        return self.path.getPos(t);
    };
    // inital facing is straight down
    self.facing = function(t) {
        return self.path.getFacing(t);
    };
}

Unit.prototype.update = function(t, destination) {
    // iteration one has no obstacles
    var start = this.pos(t);
    this.path = new PathBuilder();
    this.path.addPath(new LinearPath(start, destination, this.speed, t));
};

Unit.fromJSON = function(unit_data) {
    return new Unit(unit_data.pos);
};

Unit.prototype.toJSON = function() {
    return this.evaluate(0);
};

Unit.prototype.evaluate = function(t) {
    return {
        speed: this.speed,
        pos: this.pos(t),
        facing: this.facing(t),
        size: this.size
    };
};
