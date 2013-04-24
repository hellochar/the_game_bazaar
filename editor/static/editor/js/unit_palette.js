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

        this.bindInputOnSelection(this.editor.ui_renderer.canvas, "mousedown", onMouseDown);
        this.bindInputOnSelection(this.editor.ui_renderer.canvas, "mousemove", onMouseMove);
        this.bindInputOnSelection(this.editor.ui_renderer.canvas, "mouseup", onMouseUp);

    }.bind(this))();

    //press space to go into UnitSelectionPalette
    (function() {
        var onKeyUp = function(evt) {
            if(evt.keyCode === 32) { //space
                this.editor.setPalette(new UnitSelectionPalette(editor));
            }
        }.bind(this);

        this.bindInputOnSelection(this.editor.ui_renderer.canvas, "keyup", onKeyUp);

    }.bind(this))();

    this.domElement = $("<div><div class='players'></div><div class='ui'></div></div>");
    
    $('<input value=.1 type="text" id="unit-speed">Unit Speed<br>').appendTo($('.ui', this.domElement));
    $('<input/>', {type: 'button', value: "Add player"}).click(function (evt) {
        this.tryAddPlayer(this.editor.map.players.length);
        this.editor.map.addPlayer();
    }.bind(this)).appendTo($('<div/>').appendTo($('.ui', this.domElement)));

    this.editor.map.players.forEach(function (player, idx) {
        this.tryAddPlayer(idx);
    }.bind(this));
    $('input[value=0]', this.domElement).attr('checked', 'yes');

}

UnitPalette.prototype = Object.create( Palette.prototype );
UnitPalette.prototype.constructor = UnitPalette;

UnitPalette.prototype.tryAddPlayer = function(pid) {
    var div = $('<div/>');
    div.append( $('<input/>', {type: 'radio', name: 'player', value: pid}) );
    div.append('Player '+pid);
    div.append('<br/>');
    div.appendTo($('.players', this.domElement));
}

UnitPalette.prototype.tryAddUnit = function(pos) {
    var gamestate = this.editor.map.evaluate(0);
    if(unitsInSphere(gamestate, pos, 30).length == 0) {
        this.editor.map.addUnit(this.currentPlayer(), pos, parseInt($('#unit-speed', this.domElement).val()));
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
    var pid = $('input[name=player]:checked', this.domElement).val();
    return this.editor.map.players[pid];
};
