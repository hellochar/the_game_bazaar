function UnitSelectionPalette(editor) {
    Palette.call(this, editor);

    //press space to go into UnitPalette
    (function() {
        var onKeyUp = function(evt) {
            if(evt.keyCode === 32) { //space
                this.editor.setPalette(new UnitPalette(editor));
            }
            if(evt.keyCode === 46) { //delete
                this.selectedUnits.forEach(this.editor.map.removeUnit);
                this.setSelection([]);
            }
        }.bind(this);

        this.bindInputOnSelection(this.editor.ui_renderer.canvas, "keyup", onKeyUp);
    }.bind(this))();

    this.domElement = (function() {
        var container = 
            $('<div>' + 
                  '<div class="instructions">' + 
                      'Drag from the ground to select units.<br/>' + 
                      'Press DEL to delete selected units.<br/>' + 
                  '</div>' + 
                  '<div class="ui">' + 
                  '</div>' + 
              '</div>');

        UnitPalette.EDITABLE_PROPERTIES.forEach(function (property) {
            var inputElement = UnitPalette.makeInputForProperty(property);

            $('input', inputElement).change(function(evt) {
                this.selectedUnits.forEach(function (unit) {
                    unit[property.name] = parseFloat($(evt.target).val());
                });
            }.bind(this));

            inputElement.appendTo($('.ui', container));
        }.bind(this));

        container.selectedUnits = $('<div/>');
        container.selectedUnits.appendTo(container);

        return container;
    }.bind(this))();

    this.setSelection([]);
}



UnitSelectionPalette.prototype = Object.create( Palette.prototype );
UnitSelectionPalette.prototype.constructor = UnitSelectionPalette;

UnitSelectionPalette.prototype.setSelection = function(selection) {
    this.selectedUnits = selection;
    //upate domElement UI with selected units
    this.domElement.selectedUnits.text("You have selected " + this.selectedUnits.length+" units");
    
    // Set the properties UI elements to the selected units' values
    UnitPalette.EDITABLE_PROPERTIES.forEach(function (property) {
        var name = property.name;
        if(selection.length == 0 || selection.some(function(unit) { return unit[name] != selection[0][name]; })) {
        } else {
            $('#unit-'+name+' input').val(selection[0][name]).change();
        }
    });

}

UnitSelectionPalette.prototype.handleClick = function(clicktype, clickpos) {
    if(clicktype == 1) {
        this.setSelection(GS_UI.getIntersectingUnit(getAllUnits(this.editor.map), 0, clickpos));
    }
};
UnitSelectionPalette.prototype.handleDragEnd = function(clicktype, dragstart, dragend) {
    // if(GS_UI.getIntersectingUnit(getAllUnits(this.editor.map), 0, dragstart)
    if(clicktype == 1) {
        var rect = Game.getRect(dragstart, dragend);
        var drag_p1 = new THREE.Vector3(rect.p1.x, rect.p1.y, 0);
        var drag_p2 = new THREE.Vector3(rect.p2.x, rect.p1.y, 0);
        var drag_p3 = new THREE.Vector3(rect.p2.x, rect.p2.y, 0);
        var drag_p4 = new THREE.Vector3(rect.p1.x, rect.p2.y, 0);
        this.setSelection(GS_UI.getIntersectingUnits(getAllUnits(this.editor.map), 0, drag_p1, drag_p2, drag_p3, drag_p4));
    }
};
UnitSelectionPalette.prototype.renderMethod = function() {
    this.editor.ui_renderer.renderSelectRect();
    this.editor.ui_renderer.renderSelectionCircles(this.selectedUnits.map(function(unit) { return unit.evaluate(0); }));
};
