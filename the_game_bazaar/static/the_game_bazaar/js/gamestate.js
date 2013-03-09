function GameState(map_json) {
    // TODO
    this.players = [];
    // Has Players
}

function Player(contents_json) {
    // TODO
    this.units = [];
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

