function Editor() {
    this.setEditingMap(Editor.createDefaultMap());
}

Editor.createDefaultMap = function() {
    var gamestate = new GameState([new Player(), new Player()]);
    //Parse and then read the gamestate to get it in the same format as maps retrieved from the server
    var map = GameState.fromJSON(gamestate.toJSON());
    map.id = undefined;
    return map;
}

Editor.createMapFromResponse = function(response) {
    var map = GameState.fromJSON(JSON.parse(response.map_data));
    map.id = response.map_id;
    return map;
}

Editor.prototype.setEditingMap = function(map) {
    this.map = map;
    $('#map-id').text(map.id);
    this.render();
}

Editor.prototype.saveMap = function() {
    var self = this;
    data = {map_id : this.map.id, map_data : JSON.stringify(this.map.toJSON())};
    $.ajax({
        type: "POST",
        url: '/map/',
        data: data,
        success: function (response_json) {
            console.log("success", response_json);
            self.map.id = response_json.map_id;
            self.setEditingMap(self.map); //this call just updates the map-id element
        },
        dataType: 'json'
    });
}

//Load a map from the server with the given map id
Editor.prototype.loadMap = function(map_id) {
    $.ajax({
        type: "GET",
        url: '/map/',
        data: {map_id : map_id},
        success: function (data_json) {
            this.setEditingMap( Editor.createMapFromResponse(data_json) );
        }.bind(this),
        dataType: 'json'
    });
}

Editor.prototype.currentPlayer = function() {
    return this.map.players[$('input[name=player]:checked').val()];
}

Editor.prototype.render = function() {
    var canvas = $('#editor-canvas')[0];
    var context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);

    this.map.players.forEach(function (player, idx) {
        context.fillStyle = GameState.PLAYER_COLORS[idx];
        player.units.forEach(function (unit) {
            // context.fillRect(unit.init_pos.x - 10, unit.init_pos.y - 10, 20, 20);
            context.beginPath();
            context.arc(unit.pos(0).x, unit.pos(0).y, 10, 0, Math.PI*2, true);
            context.closePath();
            context.fill();
        });
    });
}
