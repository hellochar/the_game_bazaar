function Editor(map, ui_renderer) {
    this.setEditingMap(map || Editor.createDefaultMap());

    this.ui_renderer = ui_renderer || new UIRenderer(document.getElementById('game-ui'));
}

Editor.prototype.init = function() {
    this.ui_renderer.bindClick(this.handleClick.bind(this));
    this.ui_renderer.bindDrag(this.handleDrag.bind(this));

    this.ui_renderer.startRendering(this.renderMethod.bind(this));
};


Editor.createDefaultMap = function() {
    var gamestate = new GameState([new Player(), new Player()]);
    //Parse and then read the gamestate to get it in the same format as maps retrieved from the server
    var map = GameState.fromJSON(gamestate.toJSON());
    map.id = undefined;
    return map;
};

Editor.createMapFromResponse = function(response) {
    var map = GameState.fromJSON(JSON.parse(response.map_data));
    map.id = response.map_id;
    return map;
};

//======================
//User event handling
//======================
Editor.prototype.handleClick = function(clicktype, clickpos) {
    if(clicktype == 1) {
        this.map.addUnit(this.currentPlayer(), clickpos);
    }
};

Editor.prototype.handleDrag = function(clicktype, dragstart, dragend) {
    if(clicktype == 1) {
        this.map.addWall(dragstart, dragend);
    }
};

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
    var successCallback = function (data_json) {
        self.setEditingMap( Editor.createMapFromResponse(data_json) );
    };

    $.ajax({
        type: "GET",
        url: '/map/' + map_id,
        success: successCallback,
        dataType: 'json'
    });
};

Editor.prototype.currentPlayer = function() {
    return this.map.players[$('input[name=player]:checked').val()];
};

Editor.prototype.renderMethod = function() {
    var gamestate = this.map.evaluate(0);
    this.ui_renderer.renderGS(gamestate);
    // this.ui_renderer.renderSelectionCircles(this.selectedUnits);
};
