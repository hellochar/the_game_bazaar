//---------------------------------------------
//CANVAS FUNCTIONS
//---------------------------------------------
(function () {
var requestAnimationFrame = window.requestAnimationFrame ||
                            window.mozRequestAnimationFrame ||
                            window.webkitRequestAnimationFrame ||
                            window.msRequestAnimationFrame;

window.requestAnimationFrame = requestAnimationFrame;
})();


function Renderer() {
    // INITIALIZE CANVAS
    this.canvas = document.getElementById('game-canvas');
    // Add mouse event handlers to the canvas
    $(this.canvas).mousedown(this.mouseDown.bind(this));
    $(this.canvas).mouseup(this.mouseUp.bind(this));
    this.ctx = this.canvas.getContext("2d");
    this.ctx.globalAlpha = 0.4;
    this.ctx.textAlign = "center";
    this.ctx.font = "14px Helvetica";
    this.canvas.tabIndex = "0";
}

// Generates a random hex color
Renderer.randomColor = function() {
    return "#" + Math.random().toString(16).slice(2, 8);
};

Renderer.prototype.clear = function() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
};

// Draws a circle
Renderer.prototype.drawCircle = function(x, y, r, color) {
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.arc(x, y, r, 0, Math.PI * 2, true);
    this.ctx.fill();
};

// Render a player unit
Renderer.prototype.renderUnit = function(unit, color, nowtime, starttime) {
    var pos = unit.pos(nowtime - starttime);
    this.drawCircle(pos.x, pos.y, 20, color);
};

Renderer.prototype.getCanvasCoords = function(e) {
    var posX = $(this.canvas).position().left,
        posY = $(this.canvas).position().top;
    var x = e.pageX - posX,
        y = e.pageY - posY;
    return {'x': x, 'y': y};
};

// Event handler for mouse events
Renderer.prototype.mouseEvent = function(handler) {
    return function(e) {
        // TODO selection of units
        coords = this.getCanvasCoords(e);
        handler(coords.x, coords.y);
    }.bind(this);
};

Renderer.prototype.mouseDown = function(e) {
    this.coords = this.getCanvasCoords(e);
    return false;
};

Renderer.prototype.mouseUp = function(e) {
    newcoords = this.getCanvasCoords(e);
    if (newcoords.x === this.coords.x && newcoords.y === this.coords.y) {
        console.log("Mouse clicked");
        if (this.clickHandler) {
            this.clickHandler(newcoords);
        }
    }
    else {
        console.log("Mouse dragged");
        if (this.dragHandler) {
            this.dragHandler(this.coords, newcoords);
        }
    }
    return false;
};

Renderer.prototype.bindClick = function(clickHandler) {
    this.clickHandler = clickHandler;
};

Renderer.prototype.bindDrag = function(dragHandler) {
    this.dragHandler = dragHandler;
};

Renderer.prototype.refreshAll = function(game) {
    this.clear();
    var nowtime = Date.now();

    this.ctx.fillStyle = "Black";

    if (game.conn_state == game.GAME_STATES.CONNECTED) {
        // For each player in the gamestate
        var players = game.gamestate.players;
        players.forEach(function (player, playerind) {
            player.units.forEach(function(unit) {
                this.renderUnit(
                    unit,
                    // TODO: Refactor so that getting the player's color
                    // does not rely on getting the player's index
                    GameState.PLAYER_COLORS[playerind],
                    nowtime,
                    game.client_start_time
                    );
            }.bind(this));
        }.bind(this));
    } else if (game.conn_state == game.GAME_STATES.CONNECTING) {
        this.ctx.fillText("Connecting...", 400, 200);
    } else if (game.conn_state == game.GAME_STATES.INIT) {
        this.ctx.fillText("Initializing...", 400, 200);
    } else if (game.conn_state == game.GAME_STATES.DISCONNECTED) {
        this.ctx.fillText("Disconnected!", 400, 200);
    }

    requestAnimationFrame(function() {
        this.refreshAll(game);
    }.bind(this));
};

Renderer.prototype.startRendering = function(game) {
    requestAnimationFrame(function() {
        this.refreshAll(game);
    }.bind(this));
};
