function Palette(editor) {
    this.editor = editor;
}

function UnitPalette(editor) {
    Palette.call(this, editor);

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

function ObstaclePalette(editor) {
    Palette.call(this, editor);
}

ObstaclePalette.prototype = Object.create( Palette.prototype );
ObstaclePalette.prototype.constructor = ObstaclePalette;

ObstaclePalette.domElement = (function() {
    var container = $('<div/>');

    container.append('Drag to create obstacles.');

    return container;
})();

ObstaclePalette.prototype.handleClick = function(clicktype, clickpos) {
};
ObstaclePalette.prototype.handleDrag = function(clicktype, dragstart, dragend) {
    if(clicktype == 1) {
        this.editor.map.addWall(dragstart, dragend);
    }
};
ObstaclePalette.prototype.renderMethod = function() {
};
