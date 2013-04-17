function Editor(map, ui_renderer, palette) {
    this.setEditingMap(map || Editor.createDefaultMap());

    this.ui_renderer = ui_renderer || new UIRenderer(document.getElementById('game-ui'));
    this.setPalette(palette || new UnitPalette(this));
}

Editor.prototype.init = function() {
    this.ui_renderer.bindClick(this.handleClick.bind(this));
    this.ui_renderer.bindDrag(this.handleDrag.bind(this));

    this.ui_renderer.startRendering(this.renderMethod.bind(this));
};

Editor.prototype.error = function(msg) {
    alert(msg); //replace this later with a better error message
}

//======================
//Palette
//======================

Editor.prototype.setPalette = function(palette) {
    if(this.palette !== undefined) {
        $(this.palette.constructor.domElement).remove();
        $(this.palette).trigger("selectionLost", palette);
    }
    var oldPalette = this.palette;
    this.palette = palette;
    $(this.palette.constructor.domElement).appendTo('#palette');
    $(this.palette).trigger("selectionGained", oldPalette);
    console.log("Set palette");
}

Editor.prototype.handleClick = function(clicktype, clickpos) {
    this.palette.handleClick(clicktype, clickpos);
};

Editor.prototype.handleDrag = function(clicktype, dragstart, dragend) {
    this.palette.handleDrag(clicktype, dragstart, dragend);
};

Editor.prototype.renderMethod = function() {
    var gamestate = this.map.evaluate(0);
    this.ui_renderer.renderGS(gamestate);
    this.palette.renderMethod();
};

//======================
// Manipulation of Map
//======================
Editor.prototype.setEditingMap = function(map) {
    this.map = map;
    $('#map-id').text(map.id);
};

Editor.prototype.saveMap = function() {
    var self = this;
    var map_id = this.map.id;
    if (!map_id) {
        map_id = '';
    }
    data = {map_data : JSON.stringify(this.map.toJSON())};
    $.ajax({
        type: "POST",
        url: '/map/' + map_id,
        data: data,
        success: function (response_json) {
            console.log("success", response_json);
            self.map.id = response_json.map_id;
            self.setEditingMap(self.map); //this call just updates the map-id element
        },
        dataType: 'json'
    });
};

//Load a map from the server with the given map id
Editor.prototype.loadMap = function(map_id) {
    var self = this;
    var callback = function (response) {
        if(response.success) {
            self.setEditingMap( Editor.createMapFromResponse(response) );
        } else {
            self.error("Could not load map " + map_id + ": " + response.reason);
        }
    };

    $.ajax({
        type: "GET",
        url: '/map/' + map_id,
        success: callback,
        dataType: 'json'
    });
};

//======================
// STATIC METHODS FOR CREATING MAPS
//======================
Editor.createDefaultMap = function() {
    var gamestate = new GameState([new Player(), new Player()]);
    //Parse and then read the gamestate to get it in the same format as maps retrieved from the server
    var map = GameState.fromJSON(gamestate.toJSON());
    map.id = undefined;
    return map;
};

Editor.createMapFromResponse = function(response) {
    if(response.success) {
        var map = GameState.fromJSON(JSON.parse(response.map_data));
        map.id = response.map_id;
        return map;
    } else {
        this.error("Tried to createMap on a bad response: " + JSON.stringify(response));
    }
};
