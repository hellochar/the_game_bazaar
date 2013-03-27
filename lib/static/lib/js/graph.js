function Node(pos) {
    self.connections = [];
    self.pos = pos;
}

// Adds connection to this node and the other node.
Node.prototype.addConnection = function(node) {
    var self = this;
    self.connections.push(node);
    node.connections.push(self);
};

function Graph() {
    self.nodes = [];
}

// Adds the node to the graph.
Graph.prototype.addNode = function(node) {
    self.nodes.push(node);
};
