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
    if (this.startpos.equals(this.endpos)) {
        return this.endpos;
    }
    else {
        var dt = t - this.starttime;
        var dv = this.endpos.clone().sub(this.startpos);
        var mag = dv.length();
        var norm = dv.clone().divideScalar(mag);
        var change = norm.clone().multiplyScalar(this.speed * dt);
        if (change.length() > mag) {
            change = dv;
        }
        return this.startpos.clone().add(change);
    }
};

LinearPath.prototype.getFacing = function(t) {
    if (this.startpos.equals(this.endpos)) {
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
    var start_diff = lPath1.startpos.clone().sub(lPath2.startpos);
    var dir1 = lPath1.endpos.clone().sub(lPath1.startpos);
    var dir2 = lPath2.endpos.clone().sub(lPath2.startpos);
    var dir_diff = dir1.clone().sub(dir2);
    var A = dir_diff.dot(dir_diff);
    var B = 2 * dir_diff.dot(start_diff);
    var C = start_diff.dot(start_diff) - Math.pow(difference, 2);
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
    var totDist = path.endpos.clone().sub(path.startpos).length();
    var totTime = totDist / path.speed;
    return path.starttime + normTime * totTime;
}
