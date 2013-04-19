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

// This method is specifically designed for linear paths. Other things needs to be done
// if we are going to implement other paths.
// Regardless, the purpose of this function is to return the time at which this path
// will intersect with the other_path given. If the two paths do not intersect, this method
// will return false.
PathBuilder.prototype.intersects = function(other_path, difference) {
    var thisIndex = 0;
    var thatIndex = 0;
    var thisNumPaths = this.paths.length;
    var thatNumPaths = other_path.paths.length;
    var val;
    while (thisIndex < thisNumPaths || thatIndex < thatNumPaths) {
        // These special cases are intersections of points with paths.
        if (thisIndex === thisNumPaths) {
            val = linePointIntersection(
                other_path.paths[thatIndex],
                this.paths[thisIndex - 1].endpos,
                difference);
            if (val) {
                return val;
            }
        }
        else if (thatIndex === thatNumPaths) {
            val = linePointIntersection(
                this.paths[thisIndex],
                other_path.paths[thatIndex - 1].endpos,
                difference);
            if (val) {
                return val;
            }
        }
        var thisPath = this.paths[Math.min(thisIndex, thisNumPaths - 1)];
        var thatPath = other_path.paths[Math.min(thatIndex, thatNumPaths - 1)];
        if (thisPath.endtime < thatPath.starttime && thisIndex < thisNumPaths) {
            thisIndex += 1;
            continue;
        }
        if (thatPath.endtime < thisPath.starttime && thatIndex < thatNumPaths) {
            thatIndex += 1;
            continue;
        }
        val = linearIntersection(thisPath, thatPath, difference);
        if (val) {
            return val;
        }
        if (thisIndex < thisNumPaths &&
            (thisPath.endtime < thatPath.endtime || thatIndex === thatNumPaths)) {
            thisIndex += 1;
        }
        else {
            thatIndex += 1;
        }
    }
    return false;
};

// This method is only meant for terminal paths. Its behavior is not guaranteed when
// using possibly infinite paths.
PathBuilder.prototype.getEndTime = function(t) {
    return this.paths[this.paths.length - 1].endtime;
};
//=============================================================================
//                                LINEAR PATH
//=============================================================================
function LinearPath(startpos, endpos, speed, starttime) {
    this.startpos = startpos;
    this.endpos = endpos;
    this.speed = speed;
    this.starttime = starttime;
    this.endtime = starttime + startpos.clone().sub(endpos).length() / speed;
}

LinearPath.prototype.getPos = function(t) {
    if (this.startpos.equals(this.endpos)) {
        return this.endpos;
    }
    else {
        var dt = t - this.starttime;
        if (dt < 0) {
            return this.startpos.clone();
        }
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

// Compute the intersection of lPath with point, where intersection is defined
// as getting difference or less distance away from point.
function linePointIntersection(lPath, point, difference) {
    var v = lPath.endpos.clone().sub(lPath.startpos);
    if (v.length < 1) {
        if (lPath.startpos.clone().sub(point).length() <= difference) {
            return lPath.starttime;
        }
        else {
            return false;
        }
    }
    v.multiplyScalar(lPath.speed / v.length());
    var vectToPt = lPath.startpos.clone().sub(point);

    // Solve the quadratic formula (solved analytically on paper.)
    var a = v.dot(v);
    var b = 2 * vectToPt.dot(v);
    var c = vectToPt.dot(vectToPt) - difference * difference;

    var discriminant = b*b - 4*a*c;
    if (discriminant <= 0) {
        return false;
    }

    var t1 = (-b + Math.sqrt(discriminant)) / (2*a);
    var t2 = (-b - Math.sqrt(discriminant)) / (2*a);

    // Check if any of the options are viable.
    t1 += lPath.starttime;
    t2 += lPath.starttime;

    if (t1 < lPath.endtime && t1 > lPath.starttime &&
        t2 < lPath.endtime && t2 > lPath.starttime) {
        return Math.min(t1, t2);
    }
    else if (t1 < lPath.endtime && t1 > lPath.starttime) {
        return t1;
    }
    else if (t2 < lPath.endtime && t2 > lPath.starttime) {
        return t2;
    }
    else {
        return false;
    }
}

// Calculates the intersections between two paths, where intersection is defined as when they
// reach a distance of difference from each other at the same t.
// Returns the time at which the intersection happens.
function linearIntersection(lPath1, lPath2, difference) {
    var startTime = Math.max(lPath1.starttime, lPath2.starttime);
    var endTime = Math.min(lPath1.endtime, lPath2.endtime);
    var diffTime = endTime - startTime;
    var s1 = lPath1.getPos(startTime);
    var s2 = lPath2.getPos(startTime);
    if (endTime < startTime) {
        return false;
    }
    else if (endTime === startTime) {
        if (s1.clone().sub(s2).length() <= difference) {
            return startTime;
        }
    }
    else {
        // The angles of the lines
        var a1 = lPath1.getFacing(startTime);
        var a2 = lPath2.getFacing(startTime);
        // The speed vectors of the lines.
        var v1 = new THREE.Vector3(Math.cos(a1), Math.sin(a1)).multiplyScalar(lPath1.speed);
        var v2 = new THREE.Vector3(Math.cos(a2), Math.sin(a2)).multiplyScalar(lPath2.speed);
        // Some nice variables
        var A = s1.clone().sub(s2);
        var B = v1.clone().sub(v2);
        // Quadratic formula constants
        var a = B.dot(B);
        var b = 2 * A.dot(B);
        var c = A.dot(A) - Math.pow(difference, 2);
        var d = Math.pow(b, 2) - 4 * a * c;

        if (d < 0) {
            return false;
        }
        else if (d === 0) {
            var answer = -b / (2*a);
            // Check the constraints on the answer.
            if (answer >= 0 && answer <= diffTime) {
                return startTime + answer;
            }
            else {
                return false;
            }
        }
        else {
            var answer1 = (-b + Math.sqrt(d)) / (2*a);
            var answer2 = (-b - Math.sqrt(d)) / (2*a);
            // Check the constraints on the answers, and return the smaller of the two
            // that satisfies the constraints.
            if (answer1 >= 0 && answer1 <= diffTime && answer2 >= 0 && answer2 <= diffTime) {
                return startTime + Math.min(answer1, answer2);
            }
            else if (answer1 >= 0 && answer1 <= diffTime) {
                return startTime + answer1;
            }
            else if (answer2 >= 0 && answer2 <= diffTime) {
                return startTime + answer2;
            }
            else {
                return false;
            }
        }
    }
}
