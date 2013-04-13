//=============================================================================
//                                PATHING
//=============================================================================

// Given a start position, a destination position, and a node_graph, returns the optimal path
// (which is a list of nodes to travel through) assuming that it can fit through any sized gap between
// nodes or null if the destination is unreachable.
function getPath(start, destination, node_graph) {
    // Create a priority queue
    // This priority queue holds a dictionary with the node and the path used to reach that
    // node at a value equal to the total distance traveled in the path.
    var priority_queue = new PriorityQueue({
        'low': true // ensures that the lowest value is returned first in this priority queue.
    });

    // Keep a set of the expanded nodes.
    // If they are already expanded, we should never expand them again.
    var expanded_set = [];

    // Create the start and destination nodes, then get the path graph for this problem.
    var startNode = new Node(start);
    startNode.domain = [-Math.PI, Math.PI];
    var destNode = new Node(destination);
    destNode.domain = [-Math.PI, Math.PI];
    var pathGraph = getPathGraph(startNode, destNode, node_graph);

    priority_queue.push({'node': startNode, 'path': []}, 0);

    while (!priority_queue.empty()) {
        var pqObj = priority_queue.pop();
        var currNode = pqObj.object;
        var pathLength = pqObj.priority;
        if (currNode.node === destNode) {
            return currNode.path;
        }
        else {
            if (expanded_set.indexOf(currNode.node) === -1) {
                expandNode(currNode, pathLength, priority_queue);
                expanded_set.push(currNode.node);
            }
        }
    }
    return null;
}

// Given a priority queue object, it expands the node contained within.
// This means it will add to the priority_queue all nodes it is connected
// to with the proper path length as the priority.
function expandNode(currNode, pathLength, priority_queue) {
    currNode.node.connections.forEach(function(other_node) {
        var nextNode = {
            'node': other_node,
            'path': currNode.path.concat(other_node)
        };
        var newPathLen = currNode.node.pos.clone().sub(other_node.pos).length();
        priority_queue.push(nextNode, pathLength + newPathLen);
    });
}

// Given a startNode, destNode (both with positions in them), and a node_graph with connections
// for walls, this returns a graph where the connections are available paths.
// An important idea used in this algorithm is that a node is only an important one
// if it has an angle of more than 180 degrees between two connections (walls) and no connections
// between them. Thus the number of nodes in the path graph is less than or equal to
// the number of nodes in the node_graph plus 2.
function getPathGraph(startNode, destNode, node_graph) {
    // Create the path graph.
    var pathGraph = new Graph();

    // For each node in the node graph, add it to the path graph and add
    // any available paths. Only iterating through objects in the path
    // graph ensures that no two nodes are connected to each other twice.
    node_graph.nodes.forEach(function(node) {
        // Create a path_node object to add to the pathGraph after adding
        // the connections.
        var path_node = new Node(node.pos);
        if (!setPathNodeDomain(path_node, node)) {
            // Don't add the path node if we didn't add a path domain.
            return;
        }

        pathGraph.nodes.forEach(function(other_node) {
            if (canGo(path_node, other_node, node_graph)) {
                // Add an undirected path between the nodes.
                path_node.addConnection(other_node);
            }
        });

        // Add the node to our pathGraph
        pathGraph.addNode(path_node);
    });

    // If one can go from startNode to destNode directly, add
    // the connection between the nodes.
    if (canGo(startNode, destNode, node_graph)) {
        startNode.connections.push(destNode);
    }

    pathGraph.nodes.forEach(function(path_node) {
        if (canGo(startNode, path_node, node_graph)) {
            // Add a directed path from the start.
            startNode.connections.push(path_node);
        }
        if (canGo(path_node, destNode, node_graph)) {
            // Add a directed path to the destination.
            path_node.connections.push(destNode);
        }
    });

    // Add the start and destination nodes to our graph.
    pathGraph.addNode(startNode);
    pathGraph.addNode(destNode);
    return pathGraph;
}


// determine the path node's domain (find the biggest angle between
// connections that is larger than 180 degrees). The node this path node
// corresponds to must also be passed in.
function setPathNodeDomain(path_node, node) {
    if (node.connections.length === 1) {
        path_node.domain = [-Math.PI, Math.PI];
        return true;
    }
    else {
        var angles = node.connections.map(function(other_node) {
            return getAngle(node.pos, other_node.pos);
        });
        angles.sort();
        var prev_angle;
        var set_path = false;
        angles.every(function(angle) {
            if (prev_angle && angle - prev_angle > Math.PI) {
                path_node.domain = [prev_angle, angle];
                set_path = true;
                // Stop the every
                return !set_path;
            }
            prev_angle = angle;
            // Continue the every
            return !set_path;
        });
        // Special case because angles are 2pi periodic.
        // If the distance from the last angle to the first angle is the biggest
        // angle, this will add it to the domain correctly.
        if (angles[0] - (angles[angles.length - 1] - 2 * Math.PI) > Math.PI) {
            path_node.domain = [angles[angles.length - 1], angles[0]];
            set_path = true;
        }
        return set_path;
    }
}

// Return the x-y plane angle from v1 to v2 in the domain (-PI, PI]
function getAngle(v1, v2) {
    var dx = v2.x - v1.x;
    var dy = v2.y - v1.y;
    return Math.atan2(dy, dx);
}

// Returns true if one can travel in a straight line from node1 to node2 in the given
// node_graph. This assumes that node1 has a domain attribute defined that is an array
// of two angles in the range (-Math.PI, Math.PI].
function canGo(node1, node2, node_graph) {
    var dx = node2.pos.x - node1.pos.x;
    var dy = node2.pos.y - node1.pos.y;
    // The angle out of node1 to node2.
    var angle = Math.atan2(dy, dx);
    // The angle into node2 from node1. Should be angle + Math.PI (but in proper range).
    var other_angle = Math.atan2(-dy, -dx);
    // If it's okay to leave node1 from angle and enter node2 from other_angle,
    // then we can check whether other segments block the way.
    if (inRange(angle, node1.domain) && inRange(other_angle, node2.domain)) {
        var blocked = false;
        node_graph.nodes.every(function(node) {
            node.connections.every(function(other_node) {
                blocked = segmentsIntersect(
                    node1.pos, node2.pos,
                    node.pos, other_node.pos);
                return !blocked;
            });
            return !blocked;
        });
        return !blocked;
    }
    else {
        return false;
    }
}

// A function that takes an angle (val) and sees if it between range[0] and range[1], where
// those range values are in the domain (-Math.PI, Math.PI].
function inRange(angle, range) {
    if (angle >= range[0] && angle <= range[1]) {
        return true;
    }
    if (range[0] >= range[1]) {
        if (angle >= range[0] || angle <= range[1]) {
            return true;
        }
    }
    return false;
}

// The arguments are of the form s<segment number>p<point number>
// This function returns true if segment 1 and segment 2 cross. False otherwise.
// It's important to note that if the segments intersect at the tip, this will
// return false.
function segmentsIntersect(s1p1, s1p2, s2p1, s2p2) {
    var s1 = s1p1;
    var s2 = s2p1;
    var v1 = s1p2.clone().sub(s1p1);
    var v2 = s2p2.clone().sub(s2p1);
    //         | x11  x01 |
    // d = det(| y11  y01 |) = x11 y01 - x01 y11
    var d = v2.x * v1.y - v1.x * v2.y;
    // If the lines are near parallel, then the determinant is small, so we'll just say
    // they don't intersect.
    if (d === 0) {
        return false;
    }
    // t1 = (1/d)  ((x00 - x10) y01 - (y00 - y10) x01)
    // t2 = (1/d) -(-(x00 - x10) y11 + (y00 - y10) x11)
    var t1 = (1/d) * ((s1.x - s2.x) * v1.y - (s1.y - s2.y) * v1.x);
    var t2 = (1/d) * -(-(s1.x - s2.x) * v2.y + (s1.y - s2.y) * v2.x);
    // We have strict inequalities to ensure that segments don't intersect at the tip.
    // Apparently, if d is big, the ts can be really close to 1 or really close to 0.
    // To fix this, they are actually compared to things really close to 1 and 0.
    if (t1 > 0.000001 && t1 < 0.999999 && t2 > 0.000001 && t2 < 0.999999) {
        return s1.clone().add(v1.clone().multiplyScalar(t1));
    }
    else {
        return false;
    }
}
