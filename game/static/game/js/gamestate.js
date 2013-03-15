function GameState(map_data) {
    // Create the player array
    var self = this;
    // Hacky colors for two players only.
    self.colors = ['rgb(255, 0, 0)', 'rgb(0, 0, 255)'];
    self.players = Array(map_data.players.length);
    for (var index in map_data.players) {
        self.players[index] = new Player(map_data.players[index]);
    }
    // A function used to update the player names.
    self.populatePlayerNames = function(player_list) {
        for (var index in player_list) {
            self.players[index].username = player_list[index];
        }
    };
    return self;
}

function Player(player_data) {
    var self = this;
    self.username = "";
    // Has Units
    self.units = Array(player_data.units.length);
    for (var index in player_data.units) {
        self.units[index] = new Unit(player_data.units[index].init_pos);
    }
}

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
    };
}

