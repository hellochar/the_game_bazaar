describe("Map Editor", function() {

  describe("toJSON", function() {
    // Instantiate a testing game state with three players and some amount of units for each.
    var gamestate;
    beforeEach(function() {
      gamestate = new GameState([
        new Player([
          new Unit({'x': 0, 'y': 100}),
          new Unit({'x': 1, 'y': 101})
          ]),
        new Player([
          new Unit({'x': 2000, 'y': 2100})
          ]),
        new Player([
          ])
        ]);
    });

    describe("GameState.toJSON", function() {
      var json;
      beforeEach(function() {
        json = gamestate.toJSON();
      });

      it("should only save the players attribute", function() {
        expect(Object.keys(json)).toEqual(['players']);
      });
      it("should have the correct number of players", function() {
        expect(json.players.length).toEqual(3);
      });

      // I would like to have test like this but it's impossible to test for "functional" equality in the pos() functions of units
      // it("should be the inverse of fromJSON", function() {
      //   expect(GameState.fromJSON(gamestate.toJSON())).toEqual(gamestate);
      // });

    });

    describe("Player.toJSON", function() {
      var json;
      beforeEach(function() {
        json = gamestate.players[0].toJSON();
      });
      it("should have the correct number of units", function() {
        expect(Object.keys(json)).toEqual(['units']);
      });
      it("should only save the units attributes", function() {
        expect(json.units.length).toEqual(2);
      });
    });

    describe("Unit.toJSON", function() {
      var json;
      beforeEach(function() {
        json = gamestate.players[0].units[0].toJSON();
      });
      it("should save the position and speed and nothing else", function() {
        expect(json).toEqual({
          init_pos: {
            x: 0,
          y: 100
          },
          speed: 0.1
        });
      });
    });

  });

  describe("createMapFromResponse", function() {
    it("should correctly set map_id", function() {
      var response = {
        map_id : 12,
        success : true,
        map_data : JSON.stringify({
          players : []
        })
      };
      var created_map = createMapFromResponse(response);
      expect(created_map.id).toEqual(12);
    });
  });

  describe("createDefaultMap", function() {
    var map;
    beforeEach(function() {
      map = createDefaultMap();
    });
    it("should generate a default Map", function() {
      expect(map).toEqual(jasmine.any(GameState));
    });
    it("should not have a map id", function() {
      expect(map.id).toBeUndefined();
    });
  });

  describe("Editor UI", function() {
    describe("Adding a unit", function() {
      it("should add a unit with correct player/pos attributes", function() {
        var map = createDefaultMap();
        map.addUnit(map.players[0], {x: 100, y: 200});
        expect(map.players[0].units[0].pos(0)).toEqual({x:100, y:200});
      });
    });
  });

});

