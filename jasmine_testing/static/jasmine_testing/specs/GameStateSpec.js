describe("GameState", function() {
    // Instantiate a testing game state with three players and some amount of units for each.
    var gamestate;
    var map_data;
    beforeEach(function() {
        map_data = {
            players: [
                {units: [
                        {init_pos: {'x': 10, 'y': 15}},
                        {init_pos: {'x': 20, 'y': 25}},
                        {init_pos: {'x': 30, 'y': 35}},
                        {init_pos: {'x': 40, 'y': 45}}
                ]},
                {units: [
                        {init_pos: {'x': 50, 'y': 55}},
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

    describe("fromJSON", function() {

        //taken from http://stackoverflow.com/questions/15322793/is-there-a-jasmine-matcher-to-compare-objects-on-subsets-of-their-properties
        beforeEach(function () {
            this.addMatchers({
                toInclude: function (expected) {
                    var failed;

                    for (var i in expected) {
                        if (expected.hasOwnProperty(i) && !this.actual.hasOwnProperty(i)) {
                            failed = [i, expected[i]];
                            break;
                        }
                    }

                    if (undefined !== failed) {
                        this.message = 'Failed asserting that array includes element "' + failed[0] + ' => ' + failed[1] + '"';

                        return false;
                    }

                    return true;
                }
            });
        });

        it("it's toJSON method should output a superset of the json that it was parsed from", function() {
            expect(GameState.fromJSON(map_data).toJSON()).toInclude(map_data);
        });

        it("should have three players", function() {
            expect(gamestate.players.length).toEqual(3);
        });

        it("should have 4-4-2 units for the player at index 0-1-2", function() {
            expect(gamestate.players[0].units.length).toEqual(4);
            expect(gamestate.players[1].units.length).toEqual(4);
            expect(gamestate.players[2].units.length).toEqual(2);
        });

        it("should have units that have pos functions that evaluate to a map with x and y keys", function() {
            gamestate.players.forEach(function (player) {
                player.units.forEach(function (unit) {
                    var position = unit.pos(0);
                    expect(Object.keys(position)).toEqual(['x', 'y']);
                });
            });
        });

    });

    describe("Mutation", function() {
        it("should be able to change a username without changing other players'", function() {
            var randomName = "a user's name";
            gamestate.players[0].username = randomName;
            expect(gamestate.players[0].username).toBe(randomName);
            expect(gamestate.players[1].username).not.toBe(randomName);
            expect(gamestate.players[2].username).not.toBe(randomName);
        });

        describe("Adding a unit", function() {
            it("should add a unit with correct player/pos attributes", function() {
                var map = Editor.createDefaultMap();
                map.addUnit(map.players[0], {x: 100, y: 200});
                expect(map.players[0].units[0].pos(0)).toEqual({x:100, y:200});
            });
        });

        describe("update", function() {
            it("should move a unit correctly in the axes directions", function() {
                var modifiedUnit = gamestate.players[0].units[0];
                modifiedUnit.update(0, {'x': 20, 'y': 15});
                expect(modifiedUnit.pos(10).x).toBeCloseTo(13, 2);
                expect(modifiedUnit.pos(10).y).toBeCloseTo(15, 2);
                modifiedUnit.update(10, {'x': 13, 'y': 20});
                expect(modifiedUnit.pos(10).x).toBeCloseTo(13, 2);
                expect(modifiedUnit.pos(10).y).toBeCloseTo(15, 2);
                expect(modifiedUnit.pos(20).x).toBeCloseTo(13, 2);
                expect(modifiedUnit.pos(20).y).toBeCloseTo(18, 2);
            });

            it("should update facing correctly in the axes directions", function() {
              var modifiedUnit = gamestate.players[0].units[0];
              modifiedUnit.update(0, {'x': 20, 'y': 15});
              expect(modifiedUnit.facing(10)).toBeCloseTo(0, 2);
              modifiedUnit.update(10, {'x': 13, 'y': 20});
              expect(modifiedUnit.facing(10)).toBeCloseTo(Math.PI / 2, 2);
              expect(modifiedUnit.facing(20)).toBeCloseTo(Math.PI / 2, 2);
            });

            it("should move a unit correctly in the diagonal direction", function() {
                var modifiedUnit = gamestate.players[0].units[0];
                modifiedUnit.update(0, {'x': 40, 'y': 45});
                var xAt100 = modifiedUnit.pos(0).x + 1 / Math.sqrt(2) * 100 * modifiedUnit.speed;
                var yAt100 = modifiedUnit.pos(0).y + 1 / Math.sqrt(2) * 100 * modifiedUnit.speed;
                expect(modifiedUnit.pos(100).x).toBeCloseTo(xAt100, 2);
                expect(modifiedUnit.pos(100).y).toBeCloseTo(yAt100, 2);
                modifiedUnit.update(100, {'x': xAt100 - 30, 'y': yAt100 + 30});
                var xAt200 = xAt100 - 1 / Math.sqrt(2) * 100 * modifiedUnit.speed;
                var yAt200 = yAt100 + 1 / Math.sqrt(2) * 100 * modifiedUnit.speed;
                expect(modifiedUnit.pos(100).x).toBeCloseTo(xAt100, 2);
                expect(modifiedUnit.pos(100).y).toBeCloseTo(yAt100, 2);
                expect(modifiedUnit.pos(200).x).toBeCloseTo(xAt200, 2);
                expect(modifiedUnit.pos(200).y).toBeCloseTo(yAt200, 2);
            });

            it("should update facing correctly in the diagonal directions", function() {
              var modifiedUnit = gamestate.players[0].units[0];
              modifiedUnit.update(0, {'x': 40, 'y': 45});
              var xAt100 = modifiedUnit.pos(0).x + 1 / Math.sqrt(2) * 100 * modifiedUnit.speed;
              var yAt100 = modifiedUnit.pos(0).y + 1 / Math.sqrt(2) * 100 * modifiedUnit.speed;
              expect(modifiedUnit.facing(100)).toBeCloseTo(Math.PI / 4, 2);
              modifiedUnit.update(100, {'x': xAt100 - 30, 'y': yAt100 + 30});
              expect(modifiedUnit.facing(100)).toBeCloseTo(Math.PI * 3/4, 2);
              expect(modifiedUnit.facing(200)).toBeCloseTo(Math.PI * 3/4, 2);
            });

            it("should handle moving to the spot that it is currently at", function() {
                var ourUnit = gamestate.players[0].units[0];
                var originalPos = ourUnit.pos(0);
                ourUnit.update(0, originalPos);
                expect(ourUnit.pos(0).x).toBeCloseTo(originalPos.x);
                expect(ourUnit.pos(0).y).toBeCloseTo(originalPos.y);
            });
        });
    });

    describe("Evaluation function", function() {
        it("Should match toJSON when called on 0", function() {
            var json = gamestate.toJSON();
            var evald = gamestate.evaluate(0);
            expect(json).toEqual(evald);
        });
    });

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
            //     expect(GameState.fromJSON(gamestate.toJSON())).toEqual(gamestate);
            // });

        });

        describe("Player.toJSON", function() {
            var json;
            beforeEach(function() {
                json = gamestate.players[0].toJSON();
            });
            it("should have the correct number of units", function() {
                expect(Object.keys(json)).toEqual(['selectedUnits', 'units']);
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
            it("should save the position, speed, and facing and nothing else", function() {
                expect(json).toEqual({
                    init_pos: {
                        x: 0,
                    y: 100
                    },
                    speed: 0.3,
                    facing: -Math.PI / 2
                });
            });
        });

    });

});
