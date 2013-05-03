ObstaclePalette.instructions = $(
    "<div>" + 
    "Left-click-drag to create a wall." + 
    "</div>"
    );


function ObstaclePalette(editor) {
    Palette.call(this, editor);
    this.domElement = $('<div/>');
}

ObstaclePalette.prototype = Object.create( Palette.prototype );
ObstaclePalette.prototype.constructor = ObstaclePalette;

ObstaclePalette.prototype.handleClick = function(clicktype, clickpos) {
};

ObstaclePalette.prototype.handleKeyUp = function(key) {
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

