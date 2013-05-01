function Node(pos) {
    this.connections = [];
    this.pos = pos;
}

// Adds connection to this node and the other node.
// A node can have multiple connections to the same other node
Node.prototype.addConnection = function(node) {
    this.connections.push(node);
    node.connections.push(this);
};

// If there isn't already a connection between nodes, make one
Node.prototype.ensureConnection = function(node) {
    if(!this.hasConnection(node)) {
        this.addConnection(node);
    }
}

Node.prototype.hasConnection = function(node) {
    return this.connections.indexOf(node) !== -1;
}

Node.prototype.removeConnection = function(node) {
    this.connections.splice(this.connections.indexOf(node), 1);
    node.connections.splice(node.connections.indexOf(this), 1);
}

function Graph() {
    this.nodes = [];
}

// Adds the node to the graph, if it isn't already in there
Graph.prototype.addNode = function(node) {
    if( ! this.contains(node) ) {
        this.nodes.push(node);
    }
}

Graph.prototype.contains = function(node) {
    return this.nodes.indexOf(node) !== -1;
}

//Deletes the given node and all connections leading to it
Graph.prototype.removeNode = function(node) {
    this.nodes.splice(this.nodes.indexOf(node), 1);
    node.connections.forEach(node.removeConnection.bind(node));
}

//returns the closest node to `pos` that isn't in `toIgnore`
Graph.prototype.findClosestNode = function(pos, toIgnore) {
    var nodes = this.nodes.filter(function (node) { return toIgnore.indexOf(node) === -1; });

    if(nodes.length === 0) return null;

    return nodes.reduce(function (bestSoFar, newNode) {
        if(bestSoFar.pos.distanceTo(pos) > newNode.pos.distanceTo(pos)) {
            return newNode;
        } else {
            return bestSoFar;
        }
    });
}


Graph.fromJSON = function(graph_data) {
    var graph = new Graph();

    //1: rebuild nodes
    //2: rebuild edges


    graph_data.positions.forEach(function (pos) {
        var vect = new THREE.Vector3(pos.x, pos.y);
        graph.addNode(new Node(vect));
    });

    graph_data.connections.forEach(function (connectedNodeIndices, thisNodeIdx) {
        var node = graph.nodes[thisNodeIdx];
        connectedNodeIndices.forEach(function (nodeIndex) {
            // node.addConnection(graph.nodes[nodeIndex]);
            node.connections.push(graph.nodes[nodeIndex]);
        });
    });

    return graph;
};

/*Converts a Graph into a JSON object that looks like:
 * {
 *     positions: [<pos>, <pos>, ...],
 *     connections: [[idx, idx, ...], //connections[x] is a list of node indices that the node at positions[x] is connected to
 *                   [idx, idx, ...]
 * }
 */
Graph.prototype.toJSON = function() {
    //1: assign each node an idx
    //2: save positions
    //3: save connections
    //4: unassign idx's


    this.nodes.forEach(function (node, idx) {
        node.idx = idx;
    });

    //our invariant is positions[x] has the position of the node n where n.idx == x; we know that .map and .forEach have the same iteration order so we're good
    var positions = this.nodes.map(function (node) {
        return {x: node.pos.x, y: node.pos.y};
    });

    //same invariant for positions[x] is required for connections[x]
    var connections = this.nodes.map(function (node) {
        return node.connections.map(function (connectedNode) {
            return connectedNode.idx;
        });
    });

    this.nodes.forEach(function (node) {
        delete node['idx'];
    });

    return {
        positions: positions,
        connections: connections
    };
};
