describe("GS UI", function() {
    // Instantiate a testing game state with three players and some amount of units for each.
    var gamestate;
    var map_data;
    beforeEach(function() {
        map_data = {
            players: [
                {units: [
                        {init_pos: {'x': 10, 'y': 15}},
                        {init_pos: {'x': 20, 'y': 25}},
                        {init_pos: {'x': 40, 'y': 45}},
                        {init_pos: {'x': 40, 'y': 45}}
                ]},
                {units: [
                        {init_pos: {'x': 10, 'y': 15}},
                        {init_pos: {'x': 60, 'y': 65}},
                        {init_pos: {'x': 70, 'y': 75}},
                        {init_pos: {'x': 80, 'y': 85}}
                ]},
                {units: [
                        {init_pos: {'x': 0, 'y': 3}},
                        {init_pos: {'x': 6, 'y': 9}}
                ]}
            ]
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

        function testDrag(player_id, dragstart, dragend, selectedUnits) {
            // Assert all units are unselected before we start
            gamestate.players.forEach(function(player) {
                expect(player.selectedUnits.length).toBe(0);
            });

            // Drag on the selected points.
            GS_UI.selectUnits(gamestate.players[player_id], 0, dragstart, dragend);

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

        it("Selects a unit when you drag over it (top left to bottom right)", function() {
            // Drag from top left to bottom right
            var dragstart = {'x': 8, 'y': 13};
            var dragend = {'x': 12, 'y': 17};
            var selectedUnits = [gamestate.players[1].units[0]];
            testDrag(1, dragstart, dragend, selectedUnits);
        });

        it("Selects a unit when you drag over it (top right to bottom left)", function() {
            // Drag from top right to bottom left
            var dragstart = {'x': 12, 'y': 13};
            var dragend = {'x': 8, 'y': 17};
            var selectedUnits = [gamestate.players[1].units[0]];
            testDrag(1, dragstart, dragend, selectedUnits);
        });

        it("Selects a unit when you drag over it (bottom left to top right)", function() {
            // Drag from bottom left to top right
            var dragstart = {'x': 8, 'y': 17};
            var dragend = {'x': 12, 'y': 13};
            var selectedUnits = [gamestate.players[1].units[0]];
            testDrag(1, dragstart, dragend, selectedUnits);
        });

        it("Selects a unit when you drag over it (bottom right to top left)", function() {
            // Drag from bottom right to top left
            var dragstart = {'x': 12, 'y': 17};
            var dragend = {'x': 8, 'y': 13};
            var selectedUnits = [gamestate.players[1].units[0]];
            testDrag(1, dragstart, dragend, selectedUnits);
        });

        it("Selects multiple units when you drag over them", function() {
            // Drag over all units of player 2
            var dragstart = {'x': 0, 'y': 0};
            var dragend = {'x': 10, 'y': 10};
            var selectedUnits = gamestate.players[2].units;
            testDrag(2, dragstart, dragend, selectedUnits);
        });

    });

});
