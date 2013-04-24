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

GameState.prototype.addPlayer = function() {
    var player = new Player([], this);
    player.color = GameState.PLAYER_COLORS[this.players.length];
    this.players.push(player);
}

GameState.prototype.addUnit = function(player, position, speed, size) {
    var unit = new Unit(position, speed, size, player);
    player.units.push(unit);
    return unit;
};
GameState.prototype.removeUnit = function(unit) {
    var player = unit.player;
    player.units = player.units.filter(function(u) { return u !== unit; });
}

GameState.prototype.addWall = function(startPos, endPos) {
    var startNode = new Node(startPos);
    var endNode = new Node(endPos);
    this.obstacles.addNode(startNode);
    this.obstacles.addNode(endNode);
    startNode.addConnection(endNode);
};

// This function is called to remove bullets from the gamestate if they have reached their
// max range. This ensures that the bullets don't take up too much memory.
// t is the gametime at which we are conducting the cleanup.
GameState.prototype.cleanUp = function(t) {
    this.players.forEach(function(player) {
        player.units.forEach(function(unit) {
            var toRemove = [];
            unit.bullets.forEach(function(bullet, idx) {
                if (bullet.endTime <= t) {
                    toRemove.push(idx);
                }
            });
            unit.bullets = unit.bullets.filter(function(bullet, idx) {
                // Return true if not in the toRemove list.
                return toRemove.indexOf(idx) === -1;
            });
        });
    });
};


// //----------- Querying -------------
// GameState.prototype.getAllUnits = function() {
//     return [].concat.apply([], this.players.map(function (player) { return player.units; }));
// }
// 
// GameState.prototype.unitsInSphere = function(time, origin, radius) {
//     return this.getAllUnits().filter(function (unit) {
//         return unit.pos(time).sub(origin).length() < radius;
//     });
// }
// 
// GameState.prototype.unitsIntersectingPoint = function(time, origin) {
//     return this.getAllUnits().filter(function (unit) {
//         return unit.pos(time).sub(origin).length() < unit.size;
//     });
// }


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
function Unit(init_pos, speed, size, player) {
    // store the player that controls this unit.
    this.player = player;
    // cooldown for shooting
    this.cooldown = 1;
    // counter for when the last time this unit shot was.
    // it starts at -cooldown because they are ready at time 0.
    this.lastShot = -this.cooldown;
    // the list of bullets that this unit has fired
    this.bullets = [];
    // arbitrary speed for unit movement
    this.speed = speed || 0.1;
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

Unit.prototype.shootBullet = function(startTime) {
    var bullet = new Bullet(startTime, this.pos(startTime), this);
    this.bullets.push(bullet);
};

Unit.fromJSON = function(unit_data, player) {
    var vect = THREE.Vector3.fromJSON(unit_data.pos);
    var speed = unit_data['speed']; //possibly undefined
    var size = unit_data['size'];
    return new Unit(vect, speed, size, player);
};

Unit.prototype.toJSON = function() {
    return this.evaluate(0);
};

Unit.prototype.evaluate = function(t) {
    var position = this.pos(t);
    var filteredBullets = this.bullets.filter(function(bullet) {
        return (bullet.endTime >= t && bullet.startTime <= t);
    }.bind(t));
    var mappedBullets = filteredBullets.map(function(bullet){
        return bullet.evaluate(t);
    }.bind(t));
    return {
        speed: this.speed,
        pos: position.toJSON(),
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
    this.facing = this.unit.facing(this.startTime);
    // the place from which the bullet will travel. It should be at
    // startPos at time startTime.
    this.startPos = startPos;

    // Check for path collisions.
    this.updatePath();
}

Bullet.prototype.updatePath = function() {
    // the path this bullet would travel without collisions
    this.path = new PathBuilder();
    var angle = this.facing;
    var v = new THREE.Vector3(Math.cos(angle), Math.sin(angle));
    var endPos = this.startPos.clone().add(v.clone().multiplyScalar(this.range));

    // Check whether our trajectory hits an obstacle.
    endPos = this.checkObstacleCollision(this.startPos, endPos);

    this.path.addPath(new LinearPath(this.startPos, endPos, this.speed, this.startTime));
    // the time at which this bullet should stop being rendered/removed from the bullet list.
    this.endTime = this.path.getEndTime();

    // Check whether our trajectory hits a unit.
    this.checkUnitCollision(v);
};

Bullet.prototype.checkObstacleCollision = function(startPos, endPos) {
    var obstacles = this.unit.player.gamestate.obstacles;
    var newEndPos = endPos;
    obstacles.nodes.forEach(function(node) {
        node.connections.forEach(function(other_node) {
            var tempEnd = segmentsIntersect(node.pos, other_node.pos, startPos, endPos);
            if (tempEnd.onLine1 && tempEnd.onLine2) {
                if (startPos.distanceTo(newEndPos) > startPos.distanceTo(tempEnd.intersectionPt)) {
                    newEndPos = tempEnd.intersectionPt;
                }
            }
        });
    });
    return newEndPos;
};

// Pass in startPos, the starting position of the bullet and
// v, the vector that the bullet travels along (make it easier to
// calculate the new position)
Bullet.prototype.checkUnitCollision = function(v) {
    // If we were previously colliding with a unit, make sure that
    // we reset that unit.
    if (this.collidedUnit && this.collidedUnit.killingBullet === this) {
        this.collidedUnit.deadTime = false;
        this.collidedUnit.killingBullet = false;
    }
    // Store the unit that this bullet collides with if any.
    this.collidedUnit = false;
    var gamestate = this.unit.player.gamestate;
    gamestate.players.forEach(function(player) {
        if (player !== this.unit.player) {
            player.units.forEach(function(unit) {
                var t = this.path.intersects(unit.path, unit.size);
                // Here we assume there is only ever one path in our PathBuilder.
                var path = this.path.paths[0];
                if (t && t < path.endtime) {
                    if (this.collidedUnit && this.collidedUnit.killingBullet === this) {
                        this.collidedUnit.deadTime = false;
                        this.collidedUnit.killingBullet = false;
                    }
                    var endPos = this.startPos.clone().add(v.clone().multiplyScalar(this.speed * (t - path.starttime)));
                    this.path = new PathBuilder();
                    this.path.addPath(new LinearPath(this.startPos, endPos, this.speed, this.startTime));
                    this.collidedUnit = unit;
                    unit.deadTime = t;
                    this.endTime = t;
                    unit.killingBullet = this;
                }
            }.bind(this));
        }
    }.bind(this));
};

Bullet.prototype.evaluate = function(t) {
    return {
        pos: this.path.getPos(t),
        facing: this.path.getFacing(t)
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

function unitsIntersectingPoint(gamestate, origin) {
    return getAllUnits(gamestate).filter(function (unit) {
        return THREE.Vector3.fromJSON(unit.pos).sub(origin).length() < unit.size;
    });
}

function unitsTouchingSphere(gamestate, origin, radius) {
    return getAllUnits(gamestate).filter(function (unit) {
        return THREE.Vector3.fromJSON(unit.pos).sub(origin).length() < radius + unit.size;
    });
}
