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

Unit.prototype.update = function(t, destination, gamestate) {
    // iteration one has no obstacles
    var start = this.pos(t);
    var node_list = getPath(start, destination, gamestate.obstacles);
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

// Given a start position, a destination position, and a node_graph, returns the optimal path
// (which is a list of nodes to travel through) assuming that it can fit through any sized gap between
// nodes or null if the destination is unreachable.
function getPath(start, destination, node_graph) {
    // Start with a set with all node positions including start and destination.
    // All are initialized as false except for start, which is initialized to [0, []].
    paths = {};
    paths[start] = [0, []]; // [distance, path]
    paths[destination] = false;
    node_graph.nodes.forEach(function(node) {
        paths.node = false;
    });

    // Create a priority queue
    priority_queue = [];
    addFringeNodes(start, 0, [], destination, node_graph, priority_queue);
    while (priority_queue.length !== 0) {
        var next = priority_queue.shift();
        var dist = next[0];
        var path = next[1];
        var value = next[2];
        if (value === "destination") {
            // THEN WE'RE DONE
            return path;
        }
        else {
            // We are expanding a node.
            addFringeNodes(value.pos, dist, path, destination, node_graph, priority_queue);
        }
    }
}

// Calculates all possible moves from start in the node_graph (including destination), and
// adds them to the priority queue in the proper place.
function addFringeNodes(start, distance_traveled, path_to_start, destination, node_graph, priority_queue) {
    node_graph.nodes.forEach(function(node) {
        if (getDistance(node.pos, start) > 0.1 && canGo(start, node.pos, node_graph)) {
            insertIntoPQueue(distance_traveled + getDistance(start, node.pos), path_to_start.concat(node), node, priority_queue);
        }
    });
    if (canGo(start, destination, node_graph)) {
        insertIntoPQueue(distance_traveled + getDistance(start, destination), path_to_start, "destination", priority_queue);
    }
}

// Returns the distance between pos1 and pos2.
function getDistance(pos1, pos2) {
    var xdist = pos1.x - pos2.x;
    var ydist = pos1.y - pos2.y;
    return Math.sqrt(Math.pow(xdist, 2) + Math.pow(ydist, 2));
}

// Inserts a value into the priority_queue at the proper place. (ascending order in keys)
// If the value is already in the queue at a place before we would insert this value, don't
// insert the value.
function insertIntoPQueue(key, path, value, priority_queue) {
    var val_to_insert = [key, path, value];
    if (priority_queue.length === 0) {
        priority_queue.push(val_to_insert);
        return;
    }
    for (var q_index in priority_queue) {
        if (priority_queue.hasOwnProperty(q_index)) {
            var queue_index = priority_queue[q_index][0];
            var queue_val = priority_queue[q_index][2];
            if (queue_val === value) {
                return;
            }
            if (queue_index >= key) {
                priority_queue.splice(q_index, 0, val_to_insert);
                return;
            }
        }
    }
    priority_queue.push(val_to_insert);
}

// Returns true if one can travel in a straight line from startpos to endpos in the given
// node_graph.
function canGo(startpos, endpos, node_graph) {
    // go through the node graph and check for nodes whose connections block the line
    // from startNode to endNode.
    var visited_nodes = {};
    var ret_val = true;
    node_graph.nodes.forEach(function(node) {
        node.connections.forEach(function(other_node) {
            if (!visited_nodes.hasOwnProperty(other_node)) {
                if (segmentsIntersect(startpos, endpos, node.pos, other_node.pos)) {
                    ret_val = false;
                }
            }
        });
        visited_nodes[node] = true;
    });
    return ret_val;
}

// The arguments are of the form s<segment number>p<point number>
// This function returns true if segment 1 and segment 2 cross. False otherwise.
function segmentsIntersect(s1p1, s1p2, s2p1, s2p2) {
    var s1 = s1p1;
    var s2 = s2p1;
    var v1 = positionDifference(s1p2, s1p1);
    var v2 = positionDifference(s2p2, s2p1);
    var t1 = (v2.x * ((s1.y - s2.y) / v2.y) + s2.x - s1.x) / (v1.x * (1 - v2.x * v1.y / v2.y));
    var t2 = (s1.y - s2.y + v1.y * t1) / v2.y;
    return t1 >= 0 && t1 <= 1 && t2 >= 0 && t2 <= 1;
}
