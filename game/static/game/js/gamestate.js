//=============================================================================
//                                GAMESTATE
//=============================================================================
function GameState(players) {
    this.players = players || [];
    this.colors = ['rgb(255, 0, 0)', 'rgb(0, 0, 255)'];
}

// Takes a JSON object created by gamestate.toJSON() and converts it back into a GameState.
GameState.fromJSON = function(map_data) {
    return new GameState(map_data.players.map(Player.fromJSON));
}

//=============================================================================
//                                PLAYER
//=============================================================================
function Player(units) {
    this.units = units || [];
}

Player.fromJSON = function(player_data) {
    return new Player(player_data.units.map(Unit.fromJSON));
}

//=============================================================================
//                                UNIT
//=============================================================================
function Unit(init_pos) {
    var self = this;
    // arbitrary speed for unit movement
    self.speed = 0.1;
    // initial position function is constant
    self.pos = function(t) {
        return init_pos;
    };
    self.update = function(t, destination) {
        // iteration one has no obstacles
        var start = self.pos(t);
        if (start.x == destination.x && start.y == destination.y) {
            self.pos = function(newt) {
                return destination;
            };
        }
        else {
            self.pos = function(newt) {
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
}

Unit.fromJSON = function(unit_data) {
    return new Unit(unit_data.init_pos);
}
