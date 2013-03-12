function GameState(map_data) {
    // TODO
    this.players = [];
    for (var index in map_data.players) {
        this.players.push(Player(map_data.players[index]));
    }
    // Has Players
    this.populatePlayerNames = function(player_list) {
        for (var index in player_list) {
            this.players[index].username = player_list[index];
        }
    };
}

function Player(player_data) {
    // TODO
    this.username = "";
    this.units = [];
    for (var index in player_data.units) {
        this.units.push(Unit(player_data.units[index].init_pos));
    }
    // Has Units
}

function Unit(init_pos) {
    // arbitrary speed for unit movement
    this.speed = 5;
    // initial position function is constant
    this.pos = function(t) {
        return init_pos;
    };
    this.update = function(t, destination) {
        // iteration one has no obstacles
        start = this.pos(t);
        this.pos = function(newt) {
            dx = destination[0] - start[0];
            dy = destination[1] - start[1];
            mag = Math.sqrt(dx * dx + dy * dy);
            x = dx / mag * this.speed;
            y = dy / mag * this.speed;
            if (x > dx || x > dy) {
                x = dx;
                y = dy;
            }
            return [start[0] + x, start[1] + y];
        };
    };
}
