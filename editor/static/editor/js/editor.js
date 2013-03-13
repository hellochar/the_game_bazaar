function Player(id) {
    this.id = id;
    this.units = [];
}
Player.prototype.fillStyle = function() {
    return ['rgb(255, 0, 0)', 'rgb(0, 0, 255)'][this.id];
}

function Map(id) {
    //todo: oh god don't do this
    this.id = id;
    this.players = [new Player(0), new Player(1)];
}

Map.prototype.addUnit = function(player, position) {
    player.units.push({init_pos : position});
}

Map.prototype.getPlayerById = function(id) {
    return this.players[id];
}

Map.prototype.toJSON = function() {
    return {players: this.players}; // will have to eventually turn this into more
}

Map.fromJSON = function(json) {
    //todo: handle incomplete/bad json

    var map = new Map(json.map_id);
    json.map_data.players.forEach(function (playerObject) {
        var player = map.getPlayerById(playerObject.id);
        playerObject.units.forEach(function (unitObject) {
            map.addUnit(player, unitObject.init_pos);
        }, this);
    });
    return map;
}

$(function() {
    function setEditingMap(map) {
        window.map = map;
        $('#map-id')[0].innerHTML = map.id;
        render();
    }
    function saveMap() {
        data = {map_id : window.map.id, map_data : JSON.stringify(window.map)};
        $.post(
            '/map/',
            data,
            function(data, textStatus, jqXHR) {
                console.log(data);
            },
            'json'
            ).success(function (response_json) {
                console.log("success", response_json);
                window.map.id = response_json.map_id;
                setEditingMap(window.map);
            }).done(function (resp) {
                console.log('resp');
                console.log(resp);
            }).error(function (resp) {
                console.log("errored");
                console.log(resp);
            });
    }

    //Load a map from the server with the given map id
    function loadMap(map_id) {
        $.getJSON(
            '/map',
            {map_id : map_id},
            function(data, textStatus, jqXHR) {
                window.temp_data = data;
            }
            ).success(function (data_json) {
                setEditingMap( Map.fromJSON(data_json) );
            });
    }

    if(window.location.hash != "") {
        //hash exists; load the map
        loadMap(window.location.hash.substring(1));
    } else {
        //load new map
        setEditingMap(new Map());
    }

    function currentPlayer() {
        return window.map.players[$('input[name=player]:checked').val()];
    }

    $('#editor-canvas').mousedown(function (evt) {
        var offsetX = $('#editor-canvas').position().left;
        var offsetY = $('#editor-canvas').position().top;
        window.map.addUnit(currentPlayer(), {x: evt.clientX - offsetX, y: evt.clientY - offsetY});
        render();
    });

    $('#save-button').click(saveMap);

    $('#load-button').click(function() {
        loadMap($('#load-id').val());
    });

    function render() {
        var canvas = $('#editor-canvas')[0];
        var context = canvas.getContext('2d');
        context.clearRect(0, 0, canvas.width, canvas.height);

        window.map.players.forEach(function (player) {
            context.fillStyle = player.fillStyle();
            player.units.forEach(function (unit) {
                // context.fillRect(unit.init_pos.x - 10, unit.init_pos.y - 10, 20, 20);
                context.beginPath();
                context.arc(unit.init_pos.x, unit.init_pos.y, 10, 0, Math.PI*2, true);
                context.closePath();
                context.fill();
            });
        });
    }


});

