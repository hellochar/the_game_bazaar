describe("Game", function() {
    var game;
    beforeEach(function() {
        loadFixtures('game.html');
        window.requestAnimationFrame = function() {}; //We mock out this because it breaks in phantomjs
        // window.Renderer = jasmine.createSpyObj('Renderer', []);

        game = new Game();
        spyOn(io, 'connect').andReturn(jasmine.createSpyObj('socket', ['on', 'emit', 'disconnect']));
        // spyOn(io, 'connect').andCallThrough();
        game.init();
    });


    describe("init", function() {
        it("should set the conn_state to INIT", function() {
            expect(game.conn_state).toEqual(Game.GAME_STATES.INIT);
        });
        it("should create a socket.io connection", function() {
            expect(io.connect).toHaveBeenCalledWith('/game', {
                reconnect: false
            });
        });
        it("should bind listeners to the socket object", function() {
            ['connecting', 'connect', 'disconnect', 'error', 'join', 'start', 'click', 'drag'].forEach(function (event_name) {
                expect(game.socket.on).toHaveBeenCalledWith(event_name, jasmine.any(Function));
            });
        });
    });


    describe("handleConnecting", function() {
        it("should set the conn_state to CONNECTING", function() {
            game.handleConnecting();
            expect(game.conn_state).toEqual(Game.GAME_STATES.CONNECTING);
        });
    });


    describe("handleConnected", function() {

        it("should grab my player/map/game id from the html", function() {
            game.handleConnected();
            expect(game.player_id).toEqual(120);
            expect(game.game_id).toEqual(9999);
            expect(game.map_id).toEqual(40123);
        });

        it("should make the conn_state CONNECTED", function() {
            game.handleConnected();
            expect(game.conn_state).toEqual(Game.GAME_STATES.CONNECTED);
        });

        it("should instantiate a GameState", function() {
            spyOn(game, 'instantiateGameState');
            game.handleConnected();
            expect(game.instantiateGameState).toHaveBeenCalled();
        });

        it("should send a 'leave' message and then disconnect when the window is closing", function() {
            game.handleConnected();

            $(window).trigger("beforeunload");
            expect(game.socket.emit).toHaveBeenCalledWith('leave', {'game_id' : game.game_id} );
            expect(game.socket.disconnect).toHaveBeenCalled();
        });
    });


    describe("handleUserJoin", function() {
        it("should update the HTML to reflect the added player", function() {
            spyOn(game, 'addPlayerToHTML');
            game.handleUserJoin({player_id: 12, username: 'testuser'});
            expect(game.addPlayerToHTML).toHaveBeenCalledWith(12, 'testuser');
        });
    });


    describe("handleGameStart", function() {
        var timestamp = Date.now();
        beforeEach(function() {
        });
        it("should set up the renderer", function() {
            spyOn(game.ui_renderer, 'bindClick');
            spyOn(game.ui_renderer, 'bindDrag');
            spyOn(game.ui_renderer, 'startRendering');
            game.handleGameStart({timestamp: timestamp});
            expect(game.ui_renderer.bindClick).toHaveBeenCalled();
            expect(game.ui_renderer.bindDrag).toHaveBeenCalled();
            expect(game.ui_renderer.startRendering).toHaveBeenCalled();
        });

        it("should hide the lobby and show the game client", function() {
            spyOn(game.ui_renderer, 'startRendering');
            game.handleGameStart({timestamp: timestamp});
            expect($('#lobby-container')).toBeHidden();
            expect($('#game-container')).not.toBeHidden();
        });
        it("should set the server_start_time and client_start_times", function() {
            spyOn(game.ui_renderer, 'startRendering');
            spyOn(Date, 'now').andReturn(123456);
            game.handleGameStart({timestamp: timestamp});
            expect(game.server_start_time).toEqual(timestamp);
            expect(game.client_start_time).toEqual(123456);
        });
    });


    describe("finishInitialization", function() {
        beforeEach(function() {
            game.game_id = 9999;
            game.player_id = 120;
            spyOn(game, 'getUsernameByPid').andReturn('user1');
        });

        it("should send a join message", function() {
            game.finishInitialization();
            expect(game.socket.emit).toHaveBeenCalledWith('join', {'game_id' : 9999,'player_id' : 120, 'username': 'user1'});
        });

        it("should start the game when the #start-game button is clicked", function() {
            spyOn(game, 'start_game');
            game.finishInitialization();
            $('#start-game').click();
            expect(game.start_game).toHaveBeenCalled();
        });
    });


    describe("instantiateGameState", function() {
        beforeEach(function() {
            game.map_id = 120;
        });
        it("should make a GET request to /map/ with the map_id", function() {
            spyOn($, 'ajax');
            game.instantiateGameState();

            var request = $.ajax.mostRecentCall.args[0];
            expect(request.url).toBe('/map/');
            expect(request.type).toBe('GET');
            expect(request.data).toEqual({map_id: 120});
        });

        describe("on success", function() {
            var fakeData = {
                success: true,
                map_data: JSON.stringify(Editor.createDefaultMap().toJSON())
            };
            beforeEach(function() {
                spyOn($, 'ajax').andCallFake(function (params) {
                    params.success(fakeData);
                });
                spyOn(game, 'populatePlayerNamesInGSFromHTML');
                spyOn(game, 'finishInitialization');
            });

            it("should update the gamestate with returned data", function() {
                game.instantiateGameState();

                //Test for whether the game's gamestate was updated by making sure its toJSON method is equivalent to the one we sent in as the map data
                expect(JSON.stringify(game.gamestate.toJSON())).toEqual(fakeData.map_data);
            });
            it("should set the gamestate players' username fields", function() {
                game.instantiateGameState();

                expect(game.populatePlayerNamesInGSFromHTML).toHaveBeenCalled();
            });
            it("should finish initialization", function() {
                game.instantiateGameState();

                expect(game.finishInitialization).toHaveBeenCalled();
            });
        });

    });


    describe("addPlayerToHTML", function() {
        beforeEach(function() {
            game.gamestate = Editor.createDefaultMap();
            game.addPlayerToHTML(0, 'new-username');
        });
        it("should update the slot with the corresponding pid", function() {
            expect($('#player-slot-0')).toHaveText('new-username');
        });
        it("should update the correct player in the gamestate's slot", function() {
            expect(game.gamestate.players[0].username).toEqual('new-username');
        });
    });


    describe("getUsernameByPid", function() {
        it("should return the username in the given slot", function() {
            expect(game.getUsernameByPid(0)).toEqual('user1');
            expect(game.getUsernameByPid(1)).toEqual('user2');
        });
    });


    describe("populatePlayerNamesInGSFromHTML", function() {
        it("should update the gamestate players' username fields from the html divs", function() {
            game.gamestate = Editor.createDefaultMap();
            game.populatePlayerNamesInGSFromHTML();
            expect(game.gamestate.players[0].username).toEqual('user1');
            expect(game.gamestate.players[1].username).toEqual('user2');
        });
    });


    describe("handleClick", function() {
        beforeEach(function() {
            game.player_id = 120;
            game.game_id = 9999;
            game.handleClick(1, {x: 10, y:100});
        });
        it("should emit a 'click' event", function() {
            expect(game.socket.emit).toHaveBeenCalledWith('click', jasmine.any(Object));
        });
        it("should send the game_id and player_id", function() {
            expect(game.socket.emit.mostRecentCall.args[1]).toInclude({game_id: 9999, player_id: 120});
        });
    });


    describe("handleDrag", function() {
        beforeEach(function() {
            game.player_id = 120;
            game.game_id = 9999;
            game.handleDrag(1, {x: 10, y:100}, {x:15, y:120});
        });
        it("should emit a 'drag' event", function() {
            expect(game.socket.emit).toHaveBeenCalledWith('drag', jasmine.any(Object));
        });
        it("should send the game_id and player_id", function() {
            expect(game.socket.emit.mostRecentCall.args[1]).toInclude({game_id: 9999, player_id: 120});
        });
    });


    describe("handleClickMessage", function() {
        beforeEach(function() {
            game.server_start_time = 0;
            game.gamestate = Editor.createDefaultMap();
            spyOn(GS_UI, 'selectUnit');
            spyOn(game, 'moveUnits');
        });

        it("should select a unit on a left-click", function() {
            game.handleClickMessage({
                timestamp: 10,
                player_id: 0,
                clicktype: 1,
                clickpos: {x: 10, y: 100}
            });
            expect(GS_UI.selectUnit).toHaveBeenCalledWith(game.gamestate.players[0], 10, {x: 10, y: 100});
            expect(game.moveUnits).not.toHaveBeenCalled();
        });

        it("should move units on a right-click", function() {
            game.handleClickMessage({
                timestamp: 10,
                player_id: 0,
                clicktype: 3,
                clickpos: {x: 10, y: 100}
            });
            expect(game.moveUnits).toHaveBeenCalledWith(10, 0, {x: 10, y: 100});
            expect(GS_UI.selectUnit).not.toHaveBeenCalled();
        });
    });


    describe("handleDragMessage", function() {
        beforeEach(function() {
            game.server_start_time = 0;
            game.gamestate = Editor.createDefaultMap();
            spyOn(GS_UI, 'selectUnits');
            spyOn(game, 'moveUnits');
        });

        it("should select units on a left-click", function() {
            game.handleDragMessage({
                timestamp: 10,
                player_id: 0,
                clicktype: 1,
                dragstart: {x: 10, y: 10},
                dragend: {x:50, y:50}
            });
            expect(GS_UI.selectUnits).toHaveBeenCalledWith(game.gamestate.players[0], 10, {x:10, y:10}, {x:50, y:50});
            expect(game.moveUnits).not.toHaveBeenCalled();
        });

        it("should move units on a right-click", function() {
            game.handleDragMessage({
                timestamp: 10,
                player_id: 0,
                clicktype: 3,
                dragstart: {x: 10, y: 10},
                dragend: {x:50, y:50}
            });
            expect(GS_UI.selectUnits).not.toHaveBeenCalled();
            expect(game.moveUnits).toHaveBeenCalledWith(10, 0, {x:50, y:50});
        });
    });


    describe("moveUnits", function() {
        it("should update all selected units", function() {
            var map = Editor.createDefaultMap();
            game.gamestate = map;
            var u1 = map.addUnit(map.players[0], {x: 100, y: 100});
            var u2 = map.addUnit(map.players[0], {x: 120, y: 120});
            var u3 = map.addUnit(map.players[0], {x: 150, y: 150});
            map.players[0].selectedUnits = [ u1, u2 ];

            spyOn(u1, 'update');
            spyOn(u2, 'update');
            spyOn(u3, 'update');

            game.moveUnits(10, 0, {x: 50, y: 50});
            expect(u1.update).toHaveBeenCalledWith(10, {x:50, y:50});
            expect(u2.update).toHaveBeenCalledWith(10, {x:50, y:50});
            expect(u3.update).not.toHaveBeenCalled();
        });
    });


    describe("handleDisconnect", function() {
        it("should set the conn_state to DISCONNECTED", function() {
            game.handleDisconnect();
            expect(game.conn_state).toEqual(Game.GAME_STATES.DISCONNECTED);
        });
    });


    describe("handleConnectError", function() {
        it("NO BEHAVIOR SPECIFIED YET", function() {
        });
    });

    describe("start_game", function() {
        it("should emit a start message with the specified game_id", function() {
            game.game_id = 9999;
            game.start_game();
            expect(game.socket.emit).toHaveBeenCalledWith('start', {'game_id': 9999});
        });
    });
});

