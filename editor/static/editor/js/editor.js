function Player(id) {
    this.id = id;
    this.units = [];
}
Player.prototype.fillStyle = function() {
    return ['rgb(255, 0, 0)', 'rgb(0, 0, 255)'][this.id];
}

function Map(id) {
     //todo: oh god don't do this
     this.id = id || Math.round(Math.random() * 100000);
     this.players = [new Player(0), new Player(1)];
 }

 Map.prototype.addUnit = function(player, position) {
    player.units.push({init_pos : position});
}

Map.prototype.getPlayerById = function(id) {
    return this.players[id];
}

Map.fromJSON = function(json) {
    //todo: handle incomplete/bad json
    
    var map = new Map(json.id);
    json.players.forEach(function (playerObject) {
        var player = map.getPlayerById(playerObject.id);
        playerObject.units.forEach(function (unitObject) {
            map.addUnit(player, unitObject.init_pos);
        });
    });
    return map;
}

$(function() {
    function saveMap() {
        $.post(
                'map',          //todo: MAP ID?
                JSON.stringify(window.map),
                function(data, textStatus, jqXHR) {
                    //handle error messages
                },
                'json'
              );
    }

    function loadMap(map_id) {
        $.getJSON(
            'map',
            {map_id: map_id}
            ).success(function (data) {
                window.map = Map.fromJSON(data);
            });
    }

    if(window.location.hash != "") {
        //hash exists; load the map
        loadMap(window.location.hash.substring(1));
    } else {
        //load new map
        window.map = new Map();
    }

    function currentPlayer() {
        return window.map.players[$('input[name=player]:checked').val()];
    }

    $('#editor-canvas').mousedown(function (evt) {
        window.map.addUnit(currentPlayer(), {x: evt.offsetX, y: evt.offsetY});
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

