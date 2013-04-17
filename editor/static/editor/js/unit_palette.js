function UnitPalette(editor) {
    Palette.call(this, editor);
}

UnitPalette.prototype = Object.create( Palette.prototype );
UnitPalette.prototype.constructor = UnitPalette;

UnitPalette.domElement = (function() {
    var container = $('<div/>');

    $('<input/>', {type: 'radio', name: 'player', value: 0, checked: 'yes'}).appendTo(container);
    container.append('Player 0');
    container.append('<br/>');

    $('<input/>', {type: 'radio', name: 'player', value: 1}).appendTo(container);
    container.append('Player 1');
    container.append('<br/>');

    return container;
})();

UnitPalette.prototype.handleClick = function(clicktype, clickpos) {
    if(clicktype == 1) {
        var gamestate = this.editor.map.evaluate(0);
        if(unitsInSphere(gamestate, clickpos, 30).length == 0) {
            this.editor.map.addUnit(this.currentPlayer(), clickpos);
        }
    }
};
UnitPalette.prototype.handleDrag = function(clicktype, dragstart, dragend) {
};
UnitPalette.prototype.renderMethod = function() {
};
UnitPalette.prototype.currentPlayer = function() {
    var pid = $('input[name=player]:checked', Palette.domElement).val();
    return this.editor.map.players[pid];
};


