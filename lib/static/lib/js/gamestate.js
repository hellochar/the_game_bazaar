//=============================================================================
//                                GAMESTATE
//=============================================================================
function GameState(players) {
    this.players = players || [];
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

GameState.prototype.addUnit = function(player, position) {
    var unit = new Unit(position);
    player.units.push(unit);
    return unit;
};

// Takes a JSON object created by gamestate.toJSON() and converts it back into a GameState.
GameState.fromJSON = function(map_data) {
    return new GameState(map_data.players.map(Player.fromJSON));
};

GameState.prototype.toJSON = function() {
    return this.evaluate(0);
};

GameState.prototype.evaluate = function(t) {
    return {players: this.players.map(function (player) { return player.evaluate(t); })};
};


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
    return {units: this.units.map(function (unit) { return unit.evaluate(t); })};
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
    // initial position function is constant
    self.pos = function(t) {
        return init_pos;
    };
}

Unit.prototype.update = function(t, destination) {
    // iteration one has no obstacles
    var start = this.pos(t);
    if (start.x == destination.x && start.y == destination.y) {
        this.pos = function(newt) {
            return destination;
        };
    }
    else {
        this.pos = function(newt) {
            var dt = newt - t;
            var dx = destination.x - start.x;
            var dy = destination.y - start.y;
            var mag = Math.sqrt(dx * dx + dy * dy);
            var normdx = dx / mag;
            var normdy = dy / mag;
            var changeX = normdx * this.speed * dt;
            var changeY = normdy * this.speed * dt;
            if (Math.abs(changeX) > Math.abs(dx) || Math.abs(changeY) > Math.abs(dy)) {
                changeX = dx;
                changeY = dy;
            }
            return {'x': start.x + changeX, 'y': start.y + changeY};
        };
    }
};

Unit.fromJSON = function(unit_data) {
    return new Unit(unit_data.init_pos);
};

Unit.prototype.toJSON = function() {
    return this.evaluate(0);
};

Unit.prototype.evaluate = function(t) {
    return {
        speed: this.speed,
        init_pos: this.pos(t)
    };
};
