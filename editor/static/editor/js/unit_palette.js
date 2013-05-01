/**
 *
 * The UnitPalette provides basic functionality for placing units on the map.
 *
 */

UnitPalette.instructions = [
    "Left-click and drag to place units.",
    "Use sliders to control unit properties.",
    "Press Add Player to, well, add a player to the map.",
    "",
    "",
    "Press SPACE to go to Selection Mode."
];

//An array of properties that you should be able to modify/control
UnitPalette.EDITABLE_PROPERTIES =
    [
        {
            name: "speed",
            attr: {
                min: .01,
                max: .6,
                step: .01,
                value: .1
            }
        },
        {
            name: "size",
            attr: {
                min: 5,
                max: 100,
                step: 1,
                value: 15
            }
        },
        {
            name: "cooldown",
            attr: {
                min: 100,
                max: 10000,
                step: 100,
                value: 1000
            }
        }
    ];

UnitPalette.makeInputForProperty = function(property) {
    var inputAttributes = new Object(property);
    inputAttributes.type = 'range';

    var control = $('<input/>', inputAttributes);
    var indicator = $('<span class="badge"/>');
    var label = $('<span class="label">Unit '+ property.name +'</span>');

    control.change(function (evt) {
        indicator.text(control.val());
    });

    control.trigger('change');

    var div = $('<div/>', {class: 'property_input', id: 'unit-'+property.name}).append(label).append(control).append(indicator);
    return div;
}

function UnitPalette(editor) {
    //This is equivalent to calling the super() constructor
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

    UnitPalette.EDITABLE_PROPERTIES.forEach(function (property) {
        UnitPalette.makeInputForProperty(property).appendTo($('.ui', this.domElement));
    }.bind(this));

    //Add Player button and associated functionality
    $('<input/>', {type: 'button', value: "Add player"}).click(function (evt) {
        this.createPlayerUIElement(this.editor.map.players.length);
        this.editor.map.addPlayer();
    }.bind(this)).appendTo($('<div/>').appendTo($('.ui', this.domElement)));

    //Create a UI element for each player
    this.editor.map.players.forEach(function (player, idx) {
        this.createPlayerUIElement(idx);
    }.bind(this));


    //Make player 0 selected by default
    $('input[value=0]', this.domElement).attr('checked', 'yes');
}


//These two lines make UnitPalette a subclass of Palette
UnitPalette.prototype = Object.create( Palette.prototype );
UnitPalette.prototype.constructor = UnitPalette;

/* Create a radio button and associated label for a player, and add it to the domElement
 *
 * PARAMETERS
 *      pid - id of player to create
 */
UnitPalette.prototype.createPlayerUIElement = function(pid) {
    var div = $('<div/>');
    div.append( $('<input/>', {type: 'radio', name: 'player', value: pid}) );
    div.append('Player '+pid);
    div.append('<br/>');
    div.appendTo($('.players', this.domElement));
}

UnitPalette.prototype.tryAddUnit = function(pos) {
    var gamestate = this.editor.map.evaluate(0);

    var unit_speed = parseFloat($('#unit-speed input', this.domElement).val());
    var unit_size = parseFloat($('#unit-size input', this.domElement).val());
    var unit_cooldown = parseFloat($('#unit-cooldown input', this.domElement).val());

    if(unitsTouchingSphere(gamestate, pos, unit_size).length == 0) {
        this.editor.map.addUnit(this.currentPlayer(),
                                pos,
                                unit_speed,
                                unit_size,
                                unit_cooldown
                                );
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

