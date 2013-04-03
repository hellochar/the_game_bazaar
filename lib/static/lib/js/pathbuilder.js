//=============================================================================
//                                PATH BUILDER
//=============================================================================
function PathBuilder() {
    this.paths = [];
    this.times = [];
}

PathBuilder.prototype.addPath = function(path) {
    this.paths.push(path);
    this.times.push(path.starttime);
};

PathBuilder.prototype.getPos = function(t) {
    // Silly javascript doesn't have a reverse that doesn't mutate
    var pathClone = this.paths.concat().reverse();
    var timeClone = this.times.concat().reverse();
    for (var t_index in timeClone) {
        if (timeClone.hasOwnProperty(t_index) && t >= timeClone[t_index]) {
            return pathClone[t_index].getPos(t);
        }
    }
};

PathBuilder.prototype.getFacing = function(t) {
    // Silly javascript doesn't have a reverse that doesn't mutate
    var pathClone = this.paths.concat().reverse();
    var timeClone = this.times.concat().reverse();
    for (var t_index in timeClone) {
        if (timeClone.hasOwnProperty(t_index) && t >= timeClone[t_index]) {
            return pathClone[t_index].getFacing(t);
        }
    }
};

//=============================================================================
//                                LINEAR PATH
//=============================================================================
function LinearPath(startpos, endpos, speed, starttime) {
    this.startpos = startpos;
    this.endpos = endpos;
    this.speed = speed;
    this.starttime = starttime;
}

LinearPath.prototype.getPos = function(t) {
    if (this.startpos.x == this.endpos.x && this.startpos.y == this.endpos.y) {
        return this.endpos;
    }
    else {
        var dt = t - this.starttime;
        var dx = this.endpos.x - this.startpos.x;
        var dy = this.endpos.y - this.startpos.y;
        var mag = Math.sqrt(dx * dx + dy * dy);
        var normdx = dx / mag;
        var normdy = dy / mag;
        var changeX = normdx * this.speed * dt;
        var changeY = normdy * this.speed * dt;
        if (Math.abs(changeX) > Math.abs(dx) || Math.abs(changeY) > Math.abs(dy)) {
            changeX = dx;
            changeY = dy;
        }
        return {'x': this.startpos.x + changeX, 'y': this.startpos.y + changeY};
    }
};

LinearPath.prototype.getFacing = function(t) {
    if (this.startpos.x == this.endpos.x && this.startpos.y == this.endpos.y) {
        return -Math.PI / 2;
    }
    else {
        var dx = this.endpos.x - this.startpos.x;
        var dy = this.endpos.y - this.startpos.y;
        return Math.atan2(dy, dx);
    }
};