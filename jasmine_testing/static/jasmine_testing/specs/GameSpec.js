describe("Game", function() {
    describe("init", function() {
        it("should set the conn_state to INIT", function() {
            var game = new Game();
            spy(
            game.init();

        });
        it("should create a socket.io connection", function() {
        });
        it("should create a Renderer", function() {
        });
    });

    describe("handleConnecting", function() {
        it("should set the conn_state to CONNECTING", function() {
        });
    });

    describe("handleConnected", function() {
        it("should grab my player/map/game id from the html", function() {
        });
        it("should make the conn_state CONNECTED", function() {
        });
        it("should instantiate a GameState", function() {
        });
    });

    describe("handleUserJoin", function() {
        it("update the HTML to reflect the added player", function() {
        });
    });


    describe("handleGameStart", function() {
        it("should start listening to click events in the renderer", function() {
        });
        it("should start rendering the game", function() {
        });
        it("should hide the lobby", function() {
        });
        it("should show the game client", function() {
        });
        it("should set the server_start_time from the recieved data", function() {
        });
        it("should set the client_start_time from our local time", function() {
        });
    });

    describe("finishInitialization", function() {
        it("should send a join message", function() {
        });
    });


    describe("instantiateGameState", function() {
        it("should make a GET request to /map with the map_id", function() {
        });
        describe("on success", function() {
            it("should update the gamestate with returned data", function() {
            });
            it("should set the gamestate players' username fields", function() {
            });
            it("should finish initialization", function() {
            });
        }
    });


    describe("addPlayerToHTML", function() {
        it("should update the slot with the corresponding pid", function() {
        });
        it("should update the correct player in the gamestate's slot", function() {
        });
    });


    describe("getUsernameByPid", function() {
        it("should return the username in the given slot", function() {
        });
    });


    describe("populatePlayerNamesInGSFromHTML", function() {
        it("should update the gamestate players' username fields from the html divs", function() {
        });
    });


    describe("playerMovement", function() {
        it("should emit an input event", function() {
        });
        it("should contain the x/y location, game_id, and player_id", function() {
        });
    });


    describe("handleInput", function() {
        it("should update the unit selected by the specified player", function() {
        });
        it("should calculate the time offset based off the server time", function() {
        });
        it("should pass the newly specified location to a units' update", function() {
        });
    });


    describe("handleDisconnect", function() {
        it("should set the conn_state to DISCONNECTED", function() {
        });
    });


    describe("handleConnectError", function() {
        it("NO BEHAVIOR SPECIFIED YET", function() {
        });
    });

    describe("start_game", function() {
        it("should emit a start message with the specified game_id", function() {
        });
    });
});

