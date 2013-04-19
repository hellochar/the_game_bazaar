function UnitPalette(editor) {
    Palette.call(this, editor);

    //click and drag to add units
    (function() {
        var mouseDownButton = false; //one of: 1,2,3 or FALSE

        var onMouseMove = function(evt) {
            if(mouseDownButton === 1) {
                this.tryAddUnit(editor.ui_renderer.getCanvasCoords(evt));
            }
        }.bind(this);

        var onMouseDown = function(evt) {
            mouseDownButton = evt.which;
        }
        var onMouseUp = function(evt) {
            mouseDownButton = false;
        }

        $(this).bind("selectionGained", function(evt, oldPalette) {
            $(this.editor.ui_renderer.canvas).on("mousedown", onMouseDown);
            $(this.editor.ui_renderer.canvas).on("mousemove", onMouseMove);
            $(this.editor.ui_renderer.canvas).on("mouseup", onMouseUp);
        });
        $(this).bind("selectionLost", function(evt, newPalette) {
            $(this.editor.ui_renderer.canvas).off("mousedown", onMouseDown);
            $(this.editor.ui_renderer.canvas).off("mousemove", onMouseMove);
            $(this.editor.ui_renderer.canvas).off("mouseup", onMouseUp);
        });
    }.bind(this))();

    //press space to go into UnitSelectionPalette
    (function() {
        var onKeyPress = function(evt) {
            if(evt.keyCode === 32) { //space
                this.editor.setPalette(new UnitSelectionPalette(editor));
            }
        }.bind(this);

        $(this).bind("selectionGained", function(evt, oldPalette) {
            $(document).on("keypress", onKeyPress);
        });
        $(this).bind("selectionLost", function(evt, newPalette) {
            $(document).off("keypress", onKeyPress);
        });
    }.bind(this))();
}

UnitPalette.prototype = Object.create( Palette.prototype );
UnitPalette.prototype.constructor = UnitPalette;

UnitPalette.domElement = (function() {
    var container = $('<div/>');

    $('<input/>', {type: 'radio', name: 'player', value: 0, checked: 'yes'}).appendTo(container);
    $(container).append('Player 0');
    $(container).append('<br/>');

    $('<input/>', {type: 'radio', name: 'player', value: 1}).appendTo(container);
    $(container).append('Player 1');
    $(container).append('<br/>');

    return container;
})();

UnitPalette.prototype.tryAddUnit = function(pos) {
    var gamestate = this.editor.map.evaluate(0);
    if(unitsInSphere(gamestate, pos, 30).length == 0) {
        this.editor.map.addUnit(this.currentPlayer(), pos);
    }
}

UnitPalette.prototype.handleClick = function(clicktype, clickpos) {
    if(clicktype == 1) {
        this.tryAddUnit(clickpos);
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
