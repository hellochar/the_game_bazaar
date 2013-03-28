var GS_UI = {
    // Deselects all units, then selects a unit if one exists within its size of clickpos
    // at in-game time updateTime controlled by player_id
    selectUnit : function(gamestate, updateTime, player_id, clickpos) {
        // Find the list of units that are clicked on.
        var unit_list = gamestate.players[player_id].units;
        var units_hit = unit_list.filter(function(unit) {
            var pos = unit.pos(updateTime);
            var dist = Math.sqrt(Math.pow(clickpos.x - pos.x, 2) + Math.pow(clickpos.y - pos.y, 2));
            return dist < unit.size;
        });

        // Clear the selectedUnits list and then add a unit to it if we can.
        gamestate.players[player_id].selectedUnits = [];
        var selected_units = gamestate.players[player_id].selectedUnits;
        if (units_hit.length > 0) {
            selected_units.push(units_hit[0]);
        }
    },

    // Go through all the units owned by player_id and set whether they are selected
    // or not based on the rectangle formed by dragstart and dragend
    selectUnits : function(gamestate, updateTime, player_id, dragstart, dragend) {
        // Calculate some things to be able to compute whether
        // a unit is within our selection easier.
        var xmid = (dragstart.x + dragend.x) / 2;
        var ymid = (dragstart.y + dragend.y) / 2;
        var xrange = Math.abs(dragstart.x - xmid);
        var yrange = Math.abs(dragstart.y - ymid);

        // Set our variables of interest.
        var unit_list = gamestate.players[player_id].units;
        gamestate.players[player_id].selectedUnits = [];
        var selected_units = gamestate.players[player_id].selectedUnits;

        // Iterate through the relevant units and select them if they are in our selection box.
        unit_list.forEach(function(unit) {
            var pos = unit.pos(updateTime);
            if (Math.abs(pos.x - xmid) <= xrange &&
                Math.abs(pos.y - ymid) <= yrange) {
                selected_units.push(unit);
            }
        });
    }
};

