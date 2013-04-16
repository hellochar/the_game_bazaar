// Determine polygon intersection
function isPointInPoly(poly, pt) {
    for(var c = false, i = -1, l = poly.length, j = l - 1; ++i < l; j = i)
        ((poly[i].y <= pt.y && pt.y < poly[j].y) || (poly[j].y <= pt.y && pt.y < poly[i].y))
        && (pt.x < (poly[j].x - poly[i].x) * (pt.y - poly[i].y) / (poly[j].y - poly[i].y) + poly[i].x)
        && (c = !c);
    return c;
}
function pointInQuad(p1, p2, p3, p4, pt) {
    var poly = [p1, p2, p3, p4];
    return isPointInPoly(poly, pt);
}

var GS_UI = {
    // Deselects all units, then selects a unit if one exists within its size of clickpos
    // at in-game time updateTime controlled by player_id
    selectUnit : function(player, updateTime, clickpos) {
        // Find the list of units that are clicked on.
        var unit_list = player.units;
        var units_hit = unit_list.filter(function(unit) {
            var pos = unit.pos(updateTime);
            var dist = Math.sqrt(Math.pow(clickpos.x - pos.x, 2) + Math.pow(clickpos.y - pos.y, 2));
            return dist < unit.size;
        });

        // Clear the selectedUnits list and then add a unit to it if we can.
        player.selectedUnits = [];
        if (units_hit.length > 0) {
            player.selectedUnits.push(units_hit[0]);
        }
    },

    // Go through all the units owned by player_id and set whether they are selected
    // or not based on the rectangle formed by dragstart and dragend
    selectUnits : function(player, updateTime, drag_p1, drag_p2, drag_p3, drag_p4) {
        // Clear the selected list.
        player.selectedUnits = [];

        // Iterate through the player's units and select them if they are in our selection box.
        player.units.forEach(function(unit) {
            var pos = unit.pos(updateTime);
            if (pointInQuad(drag_p1, drag_p2, drag_p3, drag_p4, pos)) {
                player.selectedUnits.push(unit);
            }
        });
    }
};

