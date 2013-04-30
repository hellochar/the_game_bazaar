function ObstaclePalette(editor) {
    Palette.call(this, editor);
    this.domElement = (function() {
        var container = $('<div/>');

        container.append('Drag to create obstacles.<br>Press escape while dragging to cancel.</br>');

        return container;
    })();

}

ObstaclePalette.prototype = Object.create( Palette.prototype );
ObstaclePalette.prototype.constructor = ObstaclePalette;

ObstaclePalette.prototype.handleClick = function(clicktype, clickpos) {
};

ObstaclePalette.prototype.handleKeyUp = function(key) {
    if(key == 27) { //escape
        this.nodes = undefined;
    }
}

ObstaclePalette.prototype.handleDragMove = function(clicktype, dragstart, dragend) {
    if(clicktype == 1) {
        if( ! this.nodes ) {
            this.nodes = this.editor.map.addWall(dragstart, dragend);
        } else {
            this.nodes[1].pos = dragend;
        }
    }
};

ObstaclePalette.prototype.handleDragEnd = function(clicktype, dragstart, dragend) {
    if(clicktype == 1) {
        this.nodes = undefined;
    }
};

ObstaclePalette.prototype.renderMethod = function() {
};

