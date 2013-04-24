function Editor(map, ui_renderer) {
    this.ui_renderer = ui_renderer || new UIRenderer(document.getElementById('game-ui'));
    this.ui_renderer.scaleRatio = 1;
    this.ui_renderer.translatePos = function(x, y) {
        return this.scalePos(new THREE.Vector3(x,y));
    }.bind(this.ui_renderer);

    this.setEditingMap(map || Editor.createDefaultMap());
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
        $(this.palette.domElement).remove();
        $(this.palette).trigger("selectionLost", palette);
    }
    var oldPalette = this.palette;
    this.palette = palette;
    $(this.palette.domElement).appendTo('#palette');
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
    this.setPalette(new UnitPalette(this));
};

Editor.prototype.saveMap = function(map_name) {
    var self = this;
    var map_id = this.map.id || '';
    var num_players = this.map.players.length;
    data = {
        map_data : JSON.stringify(this.map.toJSON()),
        map_id : map_id,
        num_players : num_players,
        map_name: map_name,
    };
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
            $('#map_name').val(response.map_name);
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
