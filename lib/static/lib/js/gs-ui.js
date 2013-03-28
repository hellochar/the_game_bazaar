var GS_UI = {
    // Deselects all units, then selects a unit if one exists within its size of clickpos
    // at in-game time updateTime controlled by player_id
    selectUnit : function(gamestate, updateTime, player_id, clickpos) {
        var unit_list = gamestate.players[player_id].units;
        unit_list.forEach(function(unit) {
            unit.isSelected = false;
        });
        var units_hit = unit_list.filter(function(unit) {
            var pos = unit.pos(updateTime);
            var dist = Math.sqrt(Math.pow(clickpos.x - pos.x, 2) + Math.pow(clickpos.y - pos.y, 2));
            return dist < unit.size;
        });
        if (units_hit.length > 0) {
            units_hit[0].isSelected = true;
        }
    },

    // Go through all the units owned by player_id and set whether they are selected
    // or not based on the rectangle formed by dragstart and dragend
    selectUnits : function(gamestate, updateTime, player_id, dragstart, dragend) {
        var xmid = (dragstart.x + dragend.x) / 2;
        var ymid = (dragstart.y + dragend.y) / 2;
        var xrange = Math.abs(dragstart.x - xmid);
        var yrange = Math.abs(dragstart.y - ymid);
        var unit_list = gamestate.players[player_id].units;
        unit_list.forEach(function(unit) {
            var pos = unit.pos(updateTime);
            unit.isSelected = Math.abs(pos.x - xmid) <= xrange && Math.abs(pos.y - ymid) <= yrange;
        });
    }
};

