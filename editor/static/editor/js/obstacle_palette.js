function ObstaclePalette(editor) {
    Palette.call(this, editor);
    this.domElement = (function() {
        var container = $('<div/>');

        container.append('Drag to create obstacles.');

        return container;
    })();

    // Obstacles being drawn an endpoint at least this close (in canvas units)
    // to another node will make the endpoint snap to that node
    this.SNAPPING_THRESHOLD = 25;
}

ObstaclePalette.prototype = Object.create( Palette.prototype );
ObstaclePalette.prototype.constructor = ObstaclePalette;



ObstaclePalette.prototype.canSnapTo = function(pos, node) {
    return node.pos.distanceTo(pos) < this.SNAPPING_THRESHOLD;
}

ObstaclePalette.prototype.getSnappableNode = function(pos, toIgnore) {
    var closest = this.editor.map.obstacles.findClosestNode(pos, toIgnore);

    if(! closest || ! this.canSnapTo(pos, closest)) {
        return undefined;
    } else {
        return closest;
    }
};



ObstaclePalette.prototype.handleClick = function(clicktype, clickpos) {
};

ObstaclePalette.prototype.handleKeyUp = function(key) {
}

ObstaclePalette.prototype.handleDragMove = function(clicktype, dragstart, dragend) {
    if(clicktype == 1) {
        if( ! this.startNode ) {
            //initial drag

            this.startNode = this.getSnappableNode(dragstart, []) || new Node(dragstart);
            this.endNode = new Node(dragend);

            this.editor.map.obstacles.addNode(this.startNode);
            this.editor.map.obstacles.addNode(this.endNode);
            this.startNode.addConnection(this.endNode);

            //invariants:
            //      startNode is now the starting node for the new wall to be placed (either existing or new). It will not change.
            //      endNode is always a new node, whose *position* might snap to nearby nodes.
            //          when the mouse is released, we might have to merge endNode in with its snapped node
        } else {
            var snappableNode = this.getSnappableNode(dragend, [this.startNode, this.endNode]);
            if(snappableNode) {
                this.endNode.pos = snappableNode.pos;
            } else {
                this.endNode.pos = dragend;
            }
        }
    }
};

ObstaclePalette.prototype.handleDragEnd = function(clicktype, dragstart, dragend) {
    if(clicktype == 1) {
        var snappableNode = this.getSnappableNode(dragend, [this.endNode]);

        //if there is no snappable node, you're good to go because the endNode is already in the obstacles, all hooked up
        //but if there is, you have to:
        //      remove endNode from graph
        //      make connection to snappable node
        if(snappableNode) {
            this.editor.map.obstacles.removeNode(this.endNode);
            this.startNode.ensureConnection(snappableNode);
        }

        delete this['startNode'];
        delete this['endNode'];
    }
};

ObstaclePalette.prototype.renderMethod = function() {
    if( this.startNode ) {
        //render snapping circles for all nodes
        this.editor.map.obstacles.nodes.forEach(function (node) {
            if( node !== this.startNode && node !== this.endNode) {
                this.editor.ui_renderer.drawCircle(node.pos.x, node.pos.y, this.SNAPPING_THRESHOLD, "green");
            }
        }.bind(this));
    } else {
        //render snapping circle for nearest snappable circle
        var snappableNode = this.getSnappableNode(this.editor.ui_renderer.currCoords, []);
        if( snappableNode ) {
            this.editor.ui_renderer.drawCircle(snappableNode.pos.x, snappableNode.pos.y, this.SNAPPING_THRESHOLD, "green");
        }
    }
};

