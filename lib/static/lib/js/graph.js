function Node(pos) {
    this.connections = [];
    this.pos = pos;
}

// Adds connection to this node and the other node.
Node.prototype.addConnection = function(node) {
    this.connections.push(node);
    node.connections.push(this);
};

function Graph() {
    this.nodes = [];
}

// Adds the node to the graph.
Graph.prototype.addNode = function(node) {
    this.nodes.push(node);
};
