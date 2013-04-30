function Node(pos) {
    this.connections = [];
    this.pos = pos;
}

// Adds connection to this node and the other node.
Node.prototype.addConnection = function(node) {
    this.connections.push(node);
};

Node.prototype.removeConnection = function(node) {
    this.connections.splice(this.connections.indexOf(node), 1);
}

function Graph() {
    this.nodes = [];
}

// Adds the node to the graph.
Graph.prototype.addNode = function(node) {
    this.nodes.push(node);
};

Node.prototype.removeNode = function(node) {
    this.nodes.splice(this.nodes.indexOf(node), 1);
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
            node.addConnection(graph.nodes[nodeIndex]);
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
