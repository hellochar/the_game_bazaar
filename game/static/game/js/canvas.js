//---------------------------------------------
//CANVAS FUNCTIONS
//---------------------------------------------

var requestAnimationFrame = window.requestAnimationFrame ||
                            window.mozRequestAnimationFrame ||
                            window.webkitRequestAnimationFrame ||
                            window.msRequestAnimationFrame;

window.requestAnimationFrame = requestAnimationFrame;


function Canvas(App) {
    
    var self = this;

    self.canvas = document.getElementById('game-canvas');
    self.ctx = self.canvas.getContext("2d");
    self.ctx.globalAlpha = 0.4;
    self.ctx.textAlign = "center";
    self.ctx.font = "14px Helvetica";
    self.canvas.tabIndex = "0";
        
    self.randomColor = function() {
        return "#" + Math.random().toString(16).slice(2, 8);
    };

    self.clear = function() {
        self.ctx.clearRect(0, 0, self.canvas.width, self.canvas.height);
    };

    self.drawCircle = function(x, y, r, color) {
        self.ctx.fillStyle = color;
        self.ctx.beginPath();
        self.ctx.arc(x, y, r, 0, Math.PI * 2, true);
        self.ctx.fill();
    };

    self.onClick = function(e) {
        // TODO selection of units
        var posX = $(this).position().left,
            posY = $(this).position().top;
        var x = e.pageX - posX,
            y = e.pageY - posY;
        if (App.playerMovement) {
            App.playerMovement(x, y);
        }
    };

    $(self.canvas).click(self.onClick);

    self.refreshAll = function() {
        self.clear();
        var nowtime = Date.now();
        if (App.connectionState == "connected") {
            // For each player in the gamestate
            var players = App.gamestate.players;
            for (var playerind in players) {
                if (players.hasOwnProperty(playerind)) {
                    var player = players[playerind];
                    // For each unit in the player
                    for (var unitind in player.units) {
                        if (player.units.hasOwnProperty(unitind)) {
                            var unit = player.units[unitind];
                            var pos = unit.pos(nowtime - App.client_start_time);
                            var color = GameState.PLAYER_COLORS[playerind];
                            self.drawCircle(pos.x, pos.y, 20, color);
                        }
                    }
                }
            }
        } else if (App.connectionState == "connecting") {
            self.ctx.fillStyle = "Black";
            self.ctx.fillText("Connecting...", 400, 200);
        } else if (App.connectionState == "blank") {
            self.ctx.fillStyle = "Black";
            self.ctx.fillText("Nothing...", 400, 200);
        }
        requestAnimationFrame(function() {
            self.refreshAll();
        });
    };

    self.startRendering = function() {
        requestAnimationFrame(function() {
            self.refreshAll();
        });
    }

    return self;
}
