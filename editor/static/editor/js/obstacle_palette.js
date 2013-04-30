function ObstaclePalette(editor) {
    Palette.call(this, editor);
    this.domElement = (function() {
        var container = $('<div/>');

        container.append('Drag to create obstacles.');

        return container;
    })();

}

ObstaclePalette.prototype = Object.create( Palette.prototype );
ObstaclePalette.prototype.constructor = ObstaclePalette;

ObstaclePalette.prototype.handleClick = function(clicktype, clickpos) {
};
ObstaclePalette.prototype.handleDragEnd = function(clicktype, dragstart, dragend) {
    if(clicktype == 1) {
        this.editor.map.addWall(dragstart, dragend);
    }
};
ObstaclePalette.prototype.renderMethod = function() {
};

