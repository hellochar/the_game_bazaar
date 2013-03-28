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
    it("Selects a unit when you click directly on it", function() {
      // Assert all units are unselected before we start
      gamestate.players.forEach(function(player) {
        player.units.forEach(function(unit) {
          expect(unit.isSelected).toBe(false);
        });
      });

      // Click directly on the first unit of the first player
      var clickpos = {'x': 10, 'y': 15};
      GS_UI.selectUnit(gamestate, 0, 0, clickpos);
      var selectedUnit = gamestate.players[0].units[0];

      // Assert that all units are unselected unless they are the chosen unit
      gamestate.players.forEach(function(player) {
        player.units.forEach(function(unit) {
          expect(unit.isSelected).toBe(unit === selectedUnit);
        });
      });
    });

    it("Selects a unit when you click on the circle but not on the center", function() {
      // Assert all units are unselected before we start
      gamestate.players.forEach(function(player) {
        player.units.forEach(function(unit) {
          expect(unit.isSelected).toBe(false);
        });
      });

      // Click a little off-center on the second unit of the first player
      var clickpos = {'x': 25, 'y': 30};
      GS_UI.selectUnit(gamestate, 0, 0, clickpos);
      var selectedUnit = gamestate.players[0].units[1];

      // Assert that all units are unselected unless they are the chosen unit
      gamestate.players.forEach(function(player) {
        player.units.forEach(function(unit) {
          expect(unit.isSelected).toBe(unit === selectedUnit);
        });
      });
    });

    it("Selects a unit when you drag over it (top left to bottom right)", function() {
      // Assert all units are unselected before we start
      gamestate.players.forEach(function(player) {
        player.units.forEach(function(unit) {
          expect(unit.isSelected).toBe(false);
        });
      });

      // Click a little off-center on the second unit of the first player
      var dragstart = {'x': 8, 'y': 13};
      var dragend = {'x': 12, 'y': 17};
      GS_UI.selectUnits(gamestate, 0, 1, dragstart, dragend);
      var selectedUnit = gamestate.players[1].units[0];

      // Assert that all units are unselected unless they are the chosen unit
      gamestate.players.forEach(function(player) {
        player.units.forEach(function(unit) {
          expect(unit.isSelected).toBe(unit === selectedUnit);
        });
      });
    });

    it("Selects a unit when you drag over it (top right to bottom left)", function() {
      // Assert all units are unselected before we start
      gamestate.players.forEach(function(player) {
        player.units.forEach(function(unit) {
          expect(unit.isSelected).toBe(false);
        });
      });

      // Click a little off-center on the second unit of the first player
      var dragstart = {'x': 12, 'y': 13};
      var dragend = {'x': 8, 'y': 17};
      GS_UI.selectUnits(gamestate, 0, 1, dragstart, dragend);
      var selectedUnit = gamestate.players[1].units[0];

      // Assert that all units are unselected unless they are the chosen unit
      gamestate.players.forEach(function(player) {
        player.units.forEach(function(unit) {
          expect(unit.isSelected).toBe(unit === selectedUnit);
        });
      });
    });

    it("Selects a unit when you drag over it (bottom left to top right)", function() {
      // Assert all units are unselected before we start
      gamestate.players.forEach(function(player) {
        player.units.forEach(function(unit) {
          expect(unit.isSelected).toBe(false);
        });
      });

      // Click a little off-center on the second unit of the first player
      var dragstart = {'x': 8, 'y': 17};
      var dragend = {'x': 12, 'y': 13};
      GS_UI.selectUnits(gamestate, 0, 1, dragstart, dragend);
      var selectedUnit = gamestate.players[1].units[0];

      // Assert that all units are unselected unless they are the chosen unit
      gamestate.players.forEach(function(player) {
        player.units.forEach(function(unit) {
          expect(unit.isSelected).toBe(unit === selectedUnit);
        });
      });
    });

    it("Selects a unit when you drag over it (bottom right to top left)", function() {
      // Assert all units are unselected before we start
      gamestate.players.forEach(function(player) {
        player.units.forEach(function(unit) {
          expect(unit.isSelected).toBe(false);
        });
      });

      // Click a little off-center on the second unit of the first player
      var dragstart = {'x': 12, 'y': 17};
      var dragend = {'x': 8, 'y': 13};
      GS_UI.selectUnits(gamestate, 0, 1, dragstart, dragend);
      var selectedUnit = gamestate.players[1].units[0];

      // Assert that all units are unselected unless they are the chosen unit
      gamestate.players.forEach(function(player) {
        player.units.forEach(function(unit) {
          expect(unit.isSelected).toBe(unit === selectedUnit);
        });
      });
    });

    it("Selects multiple units when you drag over them", function() {
      // Assert all units are unselected before we start
      gamestate.players.forEach(function(player) {
        player.units.forEach(function(unit) {
          expect(unit.isSelected).toBe(false);
        });
      });

      // Click a little off-center on the second unit of the first player
      var dragstart = {'x': 0, 'y': 0};
      var dragend = {'x': 10, 'y': 10};
      GS_UI.selectUnits(gamestate, 0, 2, dragstart, dragend);

      // Assert that all units are unselected unless they are the chosen unit
      gamestate.players.forEach(function(player) {
        player.units.forEach(function(unit) {
          expect(unit.isSelected).toBe(gamestate.players.indexOf(player) === 2);
        });
      });
    });

  });

});
