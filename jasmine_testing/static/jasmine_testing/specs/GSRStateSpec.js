describe("GSRState", function() {
    // Instantiate a testing game state with three players and some amount of units for each.
    var gamestate;
    var map_data;
    var gs_renderer;
    var gsr_state;
    beforeEach(function() {
        gs_renderer = jasmine.createSpyObj('GSRenderer', ['makeUnit', 'makeObstacle', 'makeBullet', 'makeTerrain', 'removeMesh']);
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
        gamestate.addWall({x: 0, y: 0}, {x: 12, y: 12});
        gsr_state = new GSRState(gamestate.evaluate(0), gs_renderer);
    });

    describe("initialize", function() {
        it("should create the appropriate number of units", function() {
            expect(gs_renderer.makeUnit.callCount).toEqual(10);
        });

        it("should have three players", function() {
            expect(gsr_state.players.length).toEqual(3);
        });

        it("should call makeTerrain", function() {
            expect(gs_renderer.makeTerrain).toHaveBeenCalled();
        });

        it("should call makeObstacle", function() {
            expect(gs_renderer.makeObstacle.callCount).toEqual(2);
        });

        it("should add exactly two obstacle objects", function() {
            expect(gsr_state.obstacles.length).toEqual(2);
        });

        it("should have a terrain", function() {
            expect(gsr_state.terrain).not.toEqual([]);
        });
    });

    describe("mutation", function() {
        it("should create more units when units are added", function() {
            gamestate.addUnit(gamestate.players[0], new THREE.Vector3(0, 0, 0), 1, 1, 1);
            gsr_state.updateStateSize(gamestate.evaluate(0));
            expect(gs_renderer.makeUnit.callCount).toEqual(11);
        });

        it("should delete units when units are removed", function() {
            gamestate.removeUnit(gamestate.players[0].units[0]);
            gamestate.removeUnit(gamestate.players[0].units[0]);
            gsr_state.updateStateSize(gamestate.evaluate(0));
            expect(gs_renderer.removeMesh.callCount).toEqual(2);
        });

        it("should create bullets when bullets are shot", function() {
            gamestate.players[0].units[0].shootBullet(0);
            gsr_state.updateStateSize(gamestate.evaluate(0));
            expect(gs_renderer.makeBullet.callCount).toEqual(1);
        });

        it("should create bullets when bullets are shot and then the bullets disappear", function() {
            gamestate.players[0].units[0].shootBullet(0);
            gsr_state.updateStateSize(gamestate.evaluate(0));
            gamestate.players[0].units[0].bullets = [];
            gsr_state.updateStateSize(gamestate.evaluate(0));
            expect(gs_renderer.makeBullet.callCount).toEqual(1);
            expect(gs_renderer.removeMesh.callCount).toEqual(1);
        });

    });
});
