describe("GameState", function() {
    // Instantiate a testing game state with three players and some amount of units for each.
    var gamestate;
    var map_data;
    beforeEach(function() {
        map_data = {
            players: [
                {units: [
                        {pos: {'x': 10, 'y': 15}},
                        {pos: {'x': 20, 'y': 25}},
                        {pos: {'x': 30, 'y': 35}},
                        {pos: {'x': 40, 'y': 45}}
                ]},
                {units: [
                        {pos: {'x': 50, 'y': 55}},
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

    describe("fromJSON", function() {
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

        it("should have units that have pos functions that evaluate to THREE.Vector3 instance", function() {
            gamestate.players.forEach(function (player) {
                player.units.forEach(function (unit) {
                    var position = unit.pos(0);
                    expect(position instanceof THREE.Vector3).toBe(true);
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
                var pos = new THREE.Vector3(100, 200, 0);
                map.addUnit(map.players[0], pos);
                expect(map.players[0].units[0].pos(0)).toEqual(pos);
            });
        });

        describe("addWall", function() {

            // I (Xiaohan) was trying to write a matcher for expecting vectors positions (so you can say expect(unit.pos).vectorCloseTo({x: 10, y: 20}).
            // Couldn't get it working but I didn't want to delete the code so here it is

            // beforeEach(function () {
            //     this.addMatchers({
            //         vectorCloseTo: function (expected, distThresh) {
            //             var dist = Math.sqrt(Math.pow(this.actual.x - expected.x, 2) + Math.pow(this.actual.x - expected.x, 2));
            //             if(dist < distThresh) {
            //                 return true;
            //             } else {
            //                 this.message = 'Failed asserting that ' + JSON.stringify(expected) + ' is within ' + distThresh + ' of ' + JSON.stringify(this.actual);
            //                 return false;
            //             }
            //         }
            //     });
            // });

            it("should create nodes at the start/end positions and make a connection between them", function() {
                var map = Editor.createDefaultMap();
                map.addWall({x: 0, y: 0}, {x: 12, y: 12});

                //TODO make this test less brittle (less dependent on indicies of nodes)
                expect(map.obstacles.nodes[0].pos).toEqual({x: 0, y: 0});
                expect(map.obstacles.nodes[1].pos).toEqual({x: 12, y: 12});

                expect(map.obstacles.nodes[0].connections).toEqual([map.obstacles.nodes[1]]);
            });
        });

        describe("update", function() {
            it("should move a unit correctly in the axes directions", function() {
                var modifiedUnit = gamestate.players[0].units[0];
                modifiedUnit.update(0, new THREE.Vector3(20, 15, 0));
                var newx = 10 + 10*modifiedUnit.speed;
                expect(modifiedUnit.pos(10).x).toBeCloseTo(newx, 2);
                expect(modifiedUnit.pos(10).y).toBeCloseTo(15, 2);
                modifiedUnit.update(10, new THREE.Vector3(newx, 20, 0));
                var newy = 15 + 10*modifiedUnit.speed;
                expect(modifiedUnit.pos(10).x).toBeCloseTo(newx, 2);
                expect(modifiedUnit.pos(10).y).toBeCloseTo(15, 2);
                expect(modifiedUnit.pos(20).x).toBeCloseTo(newx, 2);
                expect(modifiedUnit.pos(20).y).toBeCloseTo(newy, 2);
            });

            it("should update facing correctly in the axes directions", function() {
                var modifiedUnit = gamestate.players[0].units[0];
                modifiedUnit.update(0, new THREE.Vector3(20, 15, 0));
                expect(modifiedUnit.facing(10)).toBeCloseTo(0, 2);
                var newx = 10 + 10*modifiedUnit.speed;
                modifiedUnit.update(10, new THREE.Vector3(newx, 20, 0));
                expect(modifiedUnit.facing(10)).toBeCloseTo(Math.PI / 2, 2);
                expect(modifiedUnit.facing(20)).toBeCloseTo(Math.PI / 2, 2);
            });

            it("should move a unit correctly in the diagonal direction", function() {
                var modifiedUnit = gamestate.players[0].units[0];
                modifiedUnit.update(0, new THREE.Vector3(40, 45, 0));
                var xAt100 = modifiedUnit.pos(0).x + 1 / Math.sqrt(2) * 100 * modifiedUnit.speed;
                var yAt100 = modifiedUnit.pos(0).y + 1 / Math.sqrt(2) * 100 * modifiedUnit.speed;
                expect(modifiedUnit.pos(100).x).toBeCloseTo(xAt100, 2);
                expect(modifiedUnit.pos(100).y).toBeCloseTo(yAt100, 2);
                modifiedUnit.update(100, new THREE.Vector3(xAt100 - 30, yAt100 + 30));
                var xAt200 = xAt100 - 1 / Math.sqrt(2) * 100 * modifiedUnit.speed;
                var yAt200 = yAt100 + 1 / Math.sqrt(2) * 100 * modifiedUnit.speed;
                expect(modifiedUnit.pos(100).x).toBeCloseTo(xAt100, 2);
                expect(modifiedUnit.pos(100).y).toBeCloseTo(yAt100, 2);
                expect(modifiedUnit.pos(200).x).toBeCloseTo(xAt200, 2);
                expect(modifiedUnit.pos(200).y).toBeCloseTo(yAt200, 2);
            });

            it("should update facing correctly in the diagonal directions", function() {
              var modifiedUnit = gamestate.players[0].units[0];
              modifiedUnit.update(0, new THREE.Vector3(40, 45, 0));
              var xAt100 = modifiedUnit.pos(0).x + 1 / Math.sqrt(2) * 100 * modifiedUnit.speed;
              var yAt100 = modifiedUnit.pos(0).y + 1 / Math.sqrt(2) * 100 * modifiedUnit.speed;
              expect(modifiedUnit.facing(100)).toBeCloseTo(Math.PI / 4, 2);
              modifiedUnit.update(100, new THREE.Vector3(xAt100 - 30, yAt100 + 30));
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

    describe("toJSON", function() {
        // Instantiate a testing game state with three players and some amount of units for each.
        var gamestate;
        beforeEach(function() {
            gamestate = new GameState([
                new Player([
                    new Unit(new THREE.Vector3(0, 100)),
                    new Unit(new THREE.Vector3(1, 101))
                    ]),
                new Player([
                    new Unit(new THREE.Vector3(2000, 2100))
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

            it("should save the players and obstacles attribute", function() {
                expect(Object.keys(json)).toEqual(['players', 'obstacles', 'terrain']);
            });
            it("should have the correct number of players", function() {
                expect(json.players.length).toEqual(3);
            });

            it("should be the inverse of fromJSON", function() {
                expect(GameState.fromJSON(gamestate.toJSON()).evaluate(0)).toEqual(gamestate.evaluate(0));
            });

        });

        describe("Player.toJSON", function() {
            var json;
            beforeEach(function() {
                json = gamestate.players[0].toJSON();
            });
            // TODO write some tests that validate the values in the result
            // by asserting what type they are. For example, units should be a list.
            it("should only save the units attributes", function() {
                expect(json.units.length).toEqual(2);
            });
        });

        describe("Unit.toJSON", function() {
            var json;
            beforeEach(function() {
                json = gamestate.players[0].units[0].toJSON();
            });
            it("should save whether or not it's selected, the position, speed, bullets, and facing and nothing else", function() {
                expect(json).toEqual({
                    speed: 0.1,
                    pos: { x: 0, y: 100, z: 0 },
                    facing: -Math.PI / 2,
                    bullets: [],
                    size: 15,
                    cooldown: 1000,
                    selected: false
                });
            });
        });

    });

    describe("Bullets", function() {
        it("shootBullet adds a bullet to the unit bullets list", function() {
            gamestate.players[0].units[0].shootBullet(0);
            expect(gamestate.players[0].units[0].bullets.length).toBe(1);
        });

        it("get cleaned up", function() {
            gamestate.players[0].units[0].shootBullet(0);
            gamestate.cleanUp(6000);
            expect(gamestate.players[0].units[0].bullets.length).toBe(0);
        });

        it("doesn't shoot when on cooldown", function() {
            var unit = gamestate.players[0].units[0];
            unit.shootBullet(0);
            expect(gamestate.players[0].units[0].bullets.length).toBe(1);
            unit.shootBullet(unit.cooldown / 2);
            expect(gamestate.players[0].units[0].bullets.length).toBe(1);
            unit.shootBullet(unit.cooldown);
            expect(gamestate.players[0].units[0].bullets.length).toBe(2);
        });
    });

    describe("Killing Bug", function() {
        var gamestate;
        beforeEach(function() {
            map_data = {
                players: [
                    {units: [
                            {pos: {'x': 0, 'y': 0}}
                    ]},
                    {units: [
                            {pos: {'x': 20, 'y': 0}}
                    ]}
                ],
                obstacles: new Graph().toJSON()
            };
            gamestate = GameState.fromJSON(map_data);
        });

        it("doesn't cause both members to die when only one should", function() {
            var u1 = gamestate.players[0].units[0];
            var u2 = gamestate.players[1].units[0];
            // Face u1 at u2
            u1.update(0, new THREE.Vector3(5, 0));
            // Face u2 away from u1
            u2.update(50, new THREE.Vector3(25, 0));

            // u2 shoots a bullet that misses
            u2.shootBullet(100);
            // while u2's bullet is in transit, u1 shoots a bullet that hits u2.
            u1.shootBullet(200);

            // Check that u1's deadTime is undefined
            expect(u1.deadTime).not.toBeTruthy();
            // Check that u2's deadTime is defined
            expect(u2.deadTime).toBeTruthy();

            // u2 shoots another bullet that hits
            u1.shootBullet(1200);
            // u2 shoots another bullet that misses
            u2.shootBullet(1300);

            // Check that u1's deadTime is undefined
            expect(u1.deadTime).not.toBeTruthy();
            // Check that u2's deadTime is defined
            expect(u2.deadTime).toBeTruthy();
        });
    });

});
