function Palette(editor) {
    this.editor = editor;
}

Palette.domElement = (function() {
    var container = $('<div/>');

    $('<input/>', {type: 'radio', name: 'player', value: 0, checked: 'yes'}).appendTo(container);
    $(container).append('Player 0');
    $(container).append('<br/>');

    $('<input/>', {type: 'radio', name: 'player', value: 1}).appendTo(container);
    $(container).append('Player 1');
    $(container).append('<br/>');

    return container;
})();

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
    var pid = $('input[name=player]:checked', Palette.domElement).val();
    return this.editor.map.players[pid];
};

Palette.prototype.renderMethod = function() {
}
