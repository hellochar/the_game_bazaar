describe("GS UI", function() {
    // Instantiate a testing game state with three players and some amount of units for each.
    var gamestate;
    var map_data;
    beforeEach(function() {
        map_data = {
            players: [
                {units: [
                        {pos: {'x': 10, 'y': 15}},
                        {pos: {'x': 20, 'y': 25}},
                        {pos: {'x': 40, 'y': 45}},
                        {pos: {'x': 40, 'y': 45}}
                ]},
                {units: [
                        {pos: {'x': 10, 'y': 15}},
                        {pos: {'x': 60, 'y': 65}},
                        {pos: {'x': 70, 'y': 75}},
                        {pos: {'x': 80, 'y': 85}}
                ]},
                {units: [
                        {pos: {'x': 0, 'y': 3}},
                        {pos: {'x': 6, 'y': 9}}
                ]}
            ],
            obstacles: new Graph().toJSON()
        };
        gamestate = GameState.fromJSON(map_data);
    });

    describe("Selection", function() {
        function testClick(player_id, clickpos, selectedUnit) {
            // Assert all units are unselected before we start
            gamestate.players.forEach(function(player) {
                expect(player.selectedUnits.length).toBe(0);
            });

            // Click on the clickpos
            GS_UI.selectUnit(gamestate.players[player_id], 0, clickpos);

            // Assert that all units are unselected unless they are the chosen unit
            gamestate.players.forEach(function(player) {
                if (gamestate.players.indexOf(player) === player_id) {
                    expect(player.selectedUnits).toEqual([selectedUnit]);
                }
                else {
                    expect(player.selectedUnits.length).toBe(0);
                }
            });
        }

        it("Selects a unit when you click directly on it", function() {
            // Click directly on the first unit of the first player
            var clickpos = {'x': 10, 'y': 15};
            var selectedUnit = gamestate.players[0].units[0];
            testClick(0, clickpos, selectedUnit);
        });

        it("Selects a unit when you click on the circle but not on the center", function() {
            // Click a little off-center on the second unit of the first player
            var clickpos = {'x': 25, 'y': 30};
            var selectedUnit = gamestate.players[0].units[1];
            testClick(0, clickpos, selectedUnit);
        });

        function testDrag(player_id, drag_p1, drag_p2, drag_p3, drag_p4, selectedUnits) {
            // Assert all units are unselected before we start
            gamestate.players.forEach(function(player) {
                expect(player.selectedUnits.length).toBe(0);
            });

            // Drag on the selected points.
            GS_UI.selectUnits(gamestate.players[player_id], 0, drag_p1, drag_p2, drag_p3, drag_p4);

            // Assert that all players have empty selected lists except for the
            // chosen player, whose list is equal to selectedUnits.
            gamestate.players.forEach(function(player) {
                if (gamestate.players.indexOf(player) === player_id) {
                    expect(player.selectedUnits).toEqual(selectedUnits);
                }
                else {
                    expect(player.selectedUnits.length).toBe(0);
                }
            });
        }

        it("Selects a unit when you drag over it (four points in non-clockwise order)", function() {
            var drag_p1 = {'x': 8, 'y': 13};
            var drag_p2 = {'x': 12, 'y': 13};
            var drag_p3 = {'x': 12, 'y': 17};
            var drag_p4 = {'x': 8, 'y': 17};
            var selectedUnits = [gamestate.players[1].units[0]];
            testDrag(1, drag_p1, drag_p3, drag_p2, drag_p4, selectedUnits);
        });

        it("Selects a unit when you drag over it (four points in clockwise order)", function() {
            var drag_p1 = {'x': 8, 'y': 13};
            var drag_p2 = {'x': 12, 'y': 13};
            var drag_p3 = {'x': 12, 'y': 17};
            var drag_p4 = {'x': 8, 'y': 17};
            var selectedUnits = [gamestate.players[1].units[0]];
            testDrag(1, drag_p1, drag_p2, drag_p3, drag_p4, selectedUnits);
        });

        it("Selects multiple units when you drag over them", function() {
            // Drag over all units of player 2
            var drag_p1 = {'x': 0, 'y': 0};
            var drag_p2 = {'x': 10, 'y': 0};
            var drag_p3 = {'x': 10, 'y': 10};
            var drag_p4 = {'x': 0, 'y': 10};
            var selectedUnits = gamestate.players[2].units;
            testDrag(2, drag_p1, drag_p2, drag_p3, drag_p4, selectedUnits);
        });

    });

});
