function GameState(map_data) {
    // Create the player array
    var self = this;
    self.players = Array(map_data.players.length);
    for (var index in map_data.players) {
        self.players[index] = Player(map_data.players[index]);
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
    self.units = Array(player_data.units.length);
    for (var index in player_data.units) {
        self.units[index] = Unit(player_data.units[index].init_pos);
    }
    // Has Units
    return self;
}

function Unit(init_pos) {
    var self = this;
    // arbitrary speed for unit movement
    self.speed = 5;
    // initial position function is constant
    self.pos = function(t) {
        return init_pos;
    };
    self.update = function(t, destination) {
        // iteration one has no obstacles
        var start = self.pos(t);
        self.pos = function(newt) {
            var dx = destination[0] - start[0];
            var dy = destination[1] - start[1];
            var mag = Math.sqrt(dx * dx + dy * dy);
            var x = dx / mag * this.speed;
            var y = dy / mag * this.speed;
            if (x > dx || x > dy) {
                x = dx;
                y = dy;
            }
            return [start[0] + x, start[1] + y];
        };
    };
    return self;
}

