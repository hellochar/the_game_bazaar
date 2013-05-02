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
ObstaclePalette.prototype.handleDrag = function(clicktype, dragstart, dragend) {
    if(clicktype == 1) {
        this.editor.map.addWall(dragstart, dragend);
    }
};
ObstaclePalette.prototype.renderMethod = function() {
};

