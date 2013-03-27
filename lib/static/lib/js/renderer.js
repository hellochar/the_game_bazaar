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
    $(this.canvas).mousemove(this.mouseMove.bind(this));
    $(this.canvas).mousedown(this.mouseDown.bind(this));
    $(this.canvas).mouseup(this.mouseUp.bind(this));
    $(this.canvas).bind('contextmenu', function(e) {
        return false;
    });
    this.coords = [undefined, undefined, undefined];
    this.currCoords = undefined;
    this.ctx = this.canvas.getContext("2d");
    this.ctx.globalAlpha = 0.4;
    this.ctx.textAlign = "center";
    this.ctx.font = "14px Helvetica";
    this.canvas.tabIndex = "0";
    this.CLICK_ERROR = 30;
    this.selecting = false;
}

// Generates a random hex color
Renderer.randomColor = function() {
    return "#" + Math.random().toString(16).slice(2, 8);
};

// Generates a rectangle {left, top, width, height} from two arbitrary points
Renderer.rectangle = function(c1, c2) {
    var x1 = Math.min(c1.x, c2.x);
    var y1 = Math.min(c1.y, c2.y);
    var x2 = Math.max(c1.x, c2.x);
    var y2 = Math.max(c1.y, c2.y);
    return {
        "x": x1,
        "y": y1,
        "w": x2 - x1,
        "h": y2 - y1
        };
};

Renderer.prototype.clear = function() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
};

// Draws a circle filled in with the color
Renderer.prototype.fillCircle = function(x, y, r, color) {
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.arc(x, y, r, 0, Math.PI * 2, true);
    this.ctx.fill();
};
// Draws a circle
Renderer.prototype.drawCircle = function(x, y, r, color) {
    this.ctx.strokeStyle = color;
    this.ctx.beginPath();
    this.ctx.arc(x, y, r, 0, Math.PI * 2, true);
    this.ctx.stroke();
};

// Render a player unit
Renderer.prototype.renderUnit = function(unit, color, nowtime, starttime) {
    var pos = unit.pos(nowtime - starttime);
    this.fillCircle(pos.x, pos.y, unit.size, color);
    if (unit.isSelected) {
        this.ctx.lineWidth = 2;
        this.ctx.globalAlpha = 1;
        this.drawCircle(pos.x, pos.y, unit.size, '#00CC00');
        this.ctx.globalAlpha = 0.4;
    }
};

Renderer.prototype.getCanvasCoords = function(e) {
    var posX = $(this.canvas).position().left,
        posY = $(this.canvas).position().top;
    var x = e.pageX - posX,
        y = e.pageY - posY;
    return {'x': x, 'y': y};
};

Renderer.prototype.mouseMove = function(e) {
    this.currCoords = this.getCanvasCoords(e);
}

Renderer.prototype.mouseDown = function(e) {
    this.coords[e.which - 1] = this.getCanvasCoords(e);
    if (e.which === 1) {
        this.selecting = true;
    }
    return false;
};

Renderer.prototype.mouseUp = function(e) {
    oldcoords = this.coords[e.which - 1];
    newcoords = this.getCanvasCoords(e);
    this.selecting = false;
    if (Math.abs(newcoords.x - oldcoords.x) < this.CLICK_ERROR &&
        Math.abs(newcoords.y - oldcoords.y) < this.CLICK_ERROR)
    {
        if (this.clickHandler) {
            this.clickHandler(e.which, newcoords);
        }
    }
    else {
        if (this.dragHandler) {
            this.dragHandler(e.which, oldcoords, newcoords);
        }
    }
    return false;
};

// The function you pass in must take two arguments: an int in range [1, 2, 3] where they
// correspond to [left, middle, right] mouse clicks, and a dictionary with entries 'x' and
// 'y' corresponding to the canvas-relative coordinates of the click.
Renderer.prototype.bindClick = function(clickHandler) {
    this.clickHandler = clickHandler;
};

// The function you pass in must take three arguments: an int in range [1, 2, 3] where they
// correspond to [left, middle, right] mouse click, and two dictionaries with entries 'x'
// and 'y' corresponding to the canvas-relative coordinates of the start of the drag and
// the end of the drag, in that order.
Renderer.prototype.bindDrag = function(dragHandler) {
    this.dragHandler = dragHandler;
};

Renderer.prototype.refreshAll = function(game) {
    this.clear();
    var nowtime = Date.now();

    this.ctx.fillStyle = "#00CC00";
    this.ctx.strokeStyle = "#00CC00";
    if (this.selecting) {
        var oldCoords = this.coords[0];
        var rect = Renderer.rectangle(oldCoords, this.currCoords);
        this.ctx.beginPath();
        this.ctx.rect(rect.x, rect.y, rect.w, rect.h);
        this.ctx.globalAlpha = 0.2;
        this.ctx.fill();
        this.ctx.lineWidth = 1;
        this.ctx.globalAlpha = 1;
        this.ctx.stroke();
        this.ctx.globalAlpha = 0.4;
    }

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
