function createDefaultMap() {
    //this code is required to get the gamestate in the same format as other maps
    var gamestate = new GameState([new Player(), new Player()]);
    var map = GameState.fromJSON(gamestate.toJSON());
    map.id = undefined;
    return map;
}

function createMapFromResponse(response) {
    var map = GameState.fromJSON(JSON.parse(response.map_data));
    map.id = response.map_id;
    return map;
}

function setEditingMap(map) {
    window.map = map;
    $('#map-id').text(map.id);
    render();
}

function saveMap() {
    data = {map_id : window.map.id, map_data : JSON.stringify(window.map.toJSON())};
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
              setEditingMap(window.map); //this call just updates the map-id element
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
    $.getJSON( //Returned content will automatically be parsed into JSON
            '/map',
            {map_id : map_id},
            function(data, textStatus, jqXHR) {
                window.temp_data = data;
            }
            ).success(function (data_json) {
                setEditingMap( createMapFromResponse(data_json) );
            });
}

function currentPlayer() {
    return window.map.players[$('input[name=player]:checked').val()];
}

function render() {
    var canvas = $('#editor-canvas')[0];
    var context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);

    window.map.players.forEach(function (player, idx) {
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

$(function() {
    if(window.location.pathname != '/editor/') { //hack to make editor.js testable
        return;
    }
    if(window.location.hash != "") {
        //hash exists; load the map
        loadMap(window.location.hash.substring(1));
    } else {
        //load new map
        setEditingMap(createDefaultMap());
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


});
