function Palette(editor) {
    this.editor = editor;
}

Palette.prototype.handleClick = function(clicktype, clickpos) {
    if(clicktype == 1) {
        this.editor.map.addUnit(this.currentPlayer(), clickpos);
    }
};

Palette.prototype.handleDrag = function(clicktype, dragstart, dragend) {
    if(clicktype == 1) {
        this.editor.map.addWall(dragstart, dragend);
    }
};

Palette.prototype.currentPlayer = function() {
    return this.editor.map.players[$('input[name=player]:checked').val()];
};

Palette.prototype.renderMethod = function() {
}
