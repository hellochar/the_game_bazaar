//=============================================================================
//                                PATH BUILDER
//=============================================================================
function PathBuilder() {
    // Paths must contain a list of path objects in chronological order (defined in the rest of this file)
    // In addition, the destination of each path in the array should be the starting position
    // of the next path in the array.
    this.paths = [];
}

PathBuilder.prototype.addPath = function(path) {
    this.paths.push(path);
};

PathBuilder.prototype.getPos = function(t) {
    var correctPath = this.getCorrectPath(t);
    return correctPath.getPos(t);
};

PathBuilder.prototype.getFacing = function(t) {
    var correctPath = this.getCorrectPath(t);
    return correctPath.getFacing(t);
};

PathBuilder.prototype.getCorrectPath = function(t) {
    // Silly javascript doesn't have a reverse that doesn't mutate
    var pathClone = this.paths.concat().reverse();
    var correctPath = pathClone.filter(function(path) { return t >= path.starttime; })[0];
    if (correctPath === undefined) {
        correctPath = pathClone[0];
    }
    return correctPath;
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


//=============================================================================
//                                Utility methods 
//=============================================================================

// Some of the following are placeholder methods that are only being used while
// we don't have a vector class.

// Calculates the intersections between two paths, where intersection is defined as when they
// reach a distance of difference from each other at the same t.
function linearIntersection(lPath1, lPath2, difference) {
    var start_diff = positionDifference(lPath1.startpos, lPath2.startpos);
    var dir1 = positionDifference(lPath1.endpos, lPath1.startpos);
    var dir2 = positionDifference(lPath2.endpos, lPath2.startpos);
    var dir_diff = positionDifference(dir1, dir2);
    var A = dotProduct(dir_diff, dir_diff);
    var B = 2 * dotProduct(dir_diff, start_diff);
    var C = dotProduct(start_diff, start_diff) - Math.pow(difference, 2);
    var D = Math.pow(B, 2) - 4 * A * C;
    if (D >= 0) {
        D = Math.sqrt(D);
    }
    else {
        // no intersection
        return false;
    }
    var t1 = (-B + D) / (2 * A);
    var t2 = (-B - D) / (2 * A);
    if (t1 >= 0 && t2 >= 0 && t1 <= 1 && t2 <= 1) {
        if (t1 < t2) {
            // use t1
            return dilationHelp(lPath1, t1);
        }
        else {
            // use t2
            return dilationHelp(lPath2, t2);
        }
    }
    else if (t1 >= 0 && t1 <= 1) {
        // use t1
        return dilationHelp(lPath1, t1);
    }
    else if (t2 >= 0 && t2 <= 1) {
        // use t2
        return dilationHelp(lPath2, t2);
    }
    else {
        // no intersection
        return false;
    }
}

// Converts normalized time (between 0 and 1) to real time (corresponding to the path data)
function dilationHelp(path, normTime) {
    var totDist = magnitude(positionDifference(path.endpos, path.startpos));
    var totTime = totDist / path.speed;
    return path.starttime + normTime * totTime;
}

// Subtraction of vectors.
function positionDifference(pos1, pos2) {
    return {'x': pos1.x - pos2.x, 'y': pos1.y - pos2.y};
}

// L2 norm of vectors.
function magnitude(vector) {
    return Math.sqrt(vector.x * vector.x + vector.y * vector.y);
}
