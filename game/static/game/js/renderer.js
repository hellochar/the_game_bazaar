//---------------------------------------------
//CANVAS FUNCTIONS
//---------------------------------------------

var requestAnimationFrame = window.requestAnimationFrame ||
                            window.mozRequestAnimationFrame ||
                            window.webkitRequestAnimationFrame ||
                            window.msRequestAnimationFrame;

window.requestAnimationFrame = requestAnimationFrame;


function Renderer() {
    
    var self = this;

    // INITIALIZE CANVAS

    self.canvas = document.getElementById('game-canvas');
    self.ctx = self.canvas.getContext("2d");
    self.ctx.globalAlpha = 0.4;
    self.ctx.textAlign = "center";
    self.ctx.font = "14px Helvetica";
    self.canvas.tabIndex = "0";
        
    // Generates a random hex color
    self.randomColor = function() {
        return "#" + Math.random().toString(16).slice(2, 8);
    };

    // Clears the canvas
    self.clear = function() {
        self.ctx.clearRect(0, 0, self.canvas.width, self.canvas.height);
    };

    // Draws a circle
    self.drawCircle = function(x, y, r, color) {
        self.ctx.fillStyle = color;
        self.ctx.beginPath();
        self.ctx.arc(x, y, r, 0, Math.PI * 2, true);
        self.ctx.fill();
    };

    // Render a player unit
    self.renderUnit = function(unit, color, nowtime, starttime) {
        var pos = unit.pos(nowtime - starttime);
        self.drawCircle(pos.x, pos.y, 20, color);
    };

    // Event handler for mouse events
    self.mouseEvent = function(handler) {
        return function(e) {
            // TODO selection of units
            var posX = $(this).position().left,
                posY = $(this).position().top;
            var x = e.pageX - posX,
                y = e.pageY - posY;
                handler(x, y);
        };
    };

    self.bindClick = function(clickHandler) {
        $(self.canvas).click(self.mouseEvent(clickHandler));
    };

    self.refreshAll = function(game) {
        self.clear();
        var nowtime = Date.now();

        self.ctx.fillStyle = "Black";

        if (game.conn_state == game.GAME_STATES.CONNECTED) {
            // For each player in the gamestate
            var players = game.gamestate.players;
            for (var playerind in players) {
                if (players.hasOwnProperty(playerind)) {
                    var player = players[playerind];
                    // For each unit in the player
                    for (var unitind in player.units) {
                        if (player.units.hasOwnProperty(unitind)) {
                            self.renderUnit(
                                player.units[unitind],
                                game.gamestate.colors[playerind],
                                nowtime,
                                game.client_start_time
                                );
                        }
                    }
                }
            }
        } else if (game.conn_state == game.GAME_STATES.CONNECTING) {
            self.ctx.fillText("Connecting...", 400, 200);
        } else if (game.conn_state == game.GAME_STATES.INIT) {
            self.ctx.fillText("Initializing...", 400, 200);
        } else if (game.conn_state == game.GAME_STATES.DISCONNECTED) {
            self.ctx.fillText("Disconnected!", 400, 200);
        }

        requestAnimationFrame(function() {
            self.refreshAll(game);
        });
    };

    self.startRendering = function(game) {
        requestAnimationFrame(function() {
            self.refreshAll(game);
        });
    };

    return self;
}
