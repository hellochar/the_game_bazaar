function UnitSelectionPalette(editor) {
    Palette.call(this, editor);

    this.selectedUnits = [];

    //press space to go into UnitPalette
    (function() {
        var onKeyUp = function(evt) {
            if(evt.keyCode === 32) { //space
                this.editor.setPalette(new UnitPalette(editor));
            }
            if(evt.keyCode === 46) { //delete
                this.selectedUnits.forEach(this.editor.map.removeUnit);
                this.selectedUnits = [];
            }
        }.bind(this);

        this.bindInputOnSelection(document, "keyup", onKeyUp);
    }.bind(this))();
}

UnitSelectionPalette.prototype = Object.create( Palette.prototype );
UnitSelectionPalette.prototype.constructor = UnitSelectionPalette;

UnitSelectionPalette.domElement = (function() {
    var container = $('<div/>');

    container.append('Drag from the ground to select units.<br/>');
    // container.append('Drag selection by dragging any selected unit.<br/>');
    container.append('Press DEL to delete selected units.<br/>');

    container.selectedUnits = $('<div/>');
    container.selectedUnits.appendTo(container);

    return container;
})();

UnitSelectionPalette.prototype.handleClick = function(clicktype, clickpos) {
    if(clicktype == 1) {
        this.selectedUnits = GS_UI.getIntersectingUnit(getAllUnits(this.editor.map), 0, clickpos);
    }
};
UnitSelectionPalette.prototype.handleDrag = function(clicktype, dragstart, dragend) {
    // if(GS_UI.getIntersectingUnit(getAllUnits(this.editor.map), 0, dragstart)
    if(clicktype == 1) {
        this.selectedUnits = GS_UI.getIntersectingUnits(getAllUnits(this.editor.map), 0, dragstart, dragend); //selectUnits' first argument should be a player but we hack it and pass this since the only attribute it needs is a variable selectedUnits of type Array
    }
};
UnitSelectionPalette.prototype.renderMethod = function() {
    //upate domElement UI with selected units
    UnitSelectionPalette.domElement.selectedUnits.text("You have selected " + this.selectedUnits.length+" units");
    this.editor.ui_renderer.renderSelectRect();
    this.editor.ui_renderer.renderSelectionCircles(this.selectedUnits.map(function(unit) { return unit.evaluate(0); }));
};
