

var GS_UI = {
    // Determine whether or not a point lies within a polygon (code was copied from google)
    isPointInPoly : function(poly, pt) {
    for (var c = false, i = -1, l = poly.length, j = l - 1; ++i < l; j = i)
        ((poly[i].y <= pt.y && pt.y < poly[j].y) || (poly[j].y <= pt.y && pt.y < poly[i].y)) &&
        (pt.x < (poly[j].x - poly[i].x) * (pt.y - poly[i].y) / (poly[j].y - poly[i].y) + poly[i].x) &&
        (c = !c);
    return c;
    },
    // Sorts the points of a polygon in clockwise order
    sortPoly : function(poly) {
        var pts = poly.length;
        var center = new THREE.Vector3(0, 0, 0);
        poly.forEach(function(pt) {
            center.x += pt.x;
            center.y += pt.y;
        });
        center.x = Math.floor(center.x/pts);
        center.y = Math.floor(center.y/pts);

        var less = function(a, b) {
            if (a.x >= 0 && b.x < 0)
                return true;
            if (a.x === 0 && b.x === 0)
                return a.y > b.y;

            // compute the cross product of vectors (center -> a) x (center -> b)
            var det = (a.x-center.x) * (b.y-center.y) - (b.x - center.x) * (a.y - center.y);
            if (det < 0)
                return true;
            if (det > 0)
                return false;

            // points a and b are on the same line from the center
            // check which point is closer to the center
            var d1 = (a.x-center.x) * (a.x-center.x) + (a.y-center.y) * (a.y-center.y);
            var d2 = (b.x-center.x) * (b.x-center.x) + (b.y-center.y) * (b.y-center.y);
            return d1 > d2;
        };
        return poly.sort(less);
    },
    // Determine whether or not a point lies within a quadrilateral
    // First four points define the quadrilateral, last one defines the point
    pointInQuad : function(p1, p2, p3, p4, pt) {
        var poly = [p1, p2, p3, p4];
        GS_UI.sortPoly(poly);
        return GS_UI.isPointInPoly(poly, pt);
    },
    // Deselects all units, then selects a unit if one exists within its size of clickpos
    // at in-game time updateTime controlled by player_id
    selectUnit : function(player, updateTime, clickpos) {
        player.selectedUnits = GS_UI.getIntersectingUnit(player.units, updateTime, clickpos);
        // Clear selection
        player.units.forEach(function(unit) {
            unit.selected = false;
        });
        // Select the one unit
        if (player.selectedUnits[0]) {
            player.selectedUnits[0].selected = true;
        }
    },

    getIntersectingUnit : function(unit_list, updateTime, clickpos) {
        // Find the list of units that are clicked on.
        var units_hit = unit_list.filter(function(unit) {
            var pos = unit.pos(updateTime);
            var dist = Math.sqrt(Math.pow(clickpos.x - pos.x, 2) + Math.pow(clickpos.y - pos.y, 2));
            return dist < unit.size;
        });

        // Clear the selectedUnits list and then add a unit to it if we can.
        var selectedUnits = [];
        if(units_hit.length > 0) {
            selectedUnits.push(units_hit[0]);
        }
        return selectedUnits;
    },

    // Go through all the units owned by player_id and set whether they are selected
    // or not based on the rectangle formed by dragstart and dragend
    selectUnits : function(player, updateTime, drag_p1, drag_p2, drag_p3, drag_p4) {
        player.selectedUnits = GS_UI.getIntersectingUnits(player.units, updateTime, drag_p1, drag_p2, drag_p3, drag_p4);
        // Clear selection
        player.units.forEach(function(unit) {
            unit.selected = false;
        });
        // Select all selected units
        player.selectedUnits.forEach(function(unit) {
            unit.selected = true;
        });
    },

    getIntersectingUnits : function(unit_list, updateTime, drag_p1, drag_p2, drag_p3, drag_p4) {
        var selectedUnits = [];

        // Iterate through units and select them if they are in our selection box.
        unit_list.forEach(function(unit) {
            var pos = unit.pos(updateTime);
            if (GS_UI.pointInQuad(drag_p1, drag_p2, drag_p3, drag_p4, pos)) {
                unit.selected = true;
                selectedUnits.push(unit);
            }
        });
        return selectedUnits;
    }
};

